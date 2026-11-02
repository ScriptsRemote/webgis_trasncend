/* =============================================================================
   app.js — servidor del TRANSCEND WebGIS (Express).
   - Sirve el sitio (carpeta public/) con cabeceras de seguridad (CSP, HSTS…).
   - /api/validacoes: proxy hacia Supabase. El navegador nunca ve claves; el
     servidor revisa los datos, limita intentos y solo él habla con el banco.
   - CORS cerrado: solo el propio sitio (y los orígenes de ALLOWED_ORIGINS).
   Exporta una función que crea la app (la usa server/index.js; se puede
   probar sin abrir un puerto).
   ========================================================================== */
'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const supabase = require('./supabase');
const { validarRegistro, ErroDados, UUID } = require('./validar');

const PUBLIC = path.join(__dirname, '..', 'public');
const PRODUCAO = process.env.NODE_ENV === 'production';
const ORIGENS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
const SAL_IP = process.env.IP_HASH_SALT || supabase.CHAVE || 'transcend';

// Política de contenido: solo scripts propios; imágenes de los mapas base (Esri, OSM).
const CSP = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],          // Leaflet posiciona el mapa con atributos style
  imgSrc: ["'self'", 'data:', 'blob:', 'https://server.arcgisonline.com', 'https://tile.openstreetmap.org'],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: PRODUCAO ? [] : null,
};

// Límite por IP en memoria (primera barrera). La segunda barrera está en el banco
// (rate_limit_check), que vale también con varias instancias.
const limite = (janelaMs, max) => rateLimit({
  windowMs: janelaMs, limit: max, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { erro: 'muitas_tentativas' },
});

const hashIp = (ip) => crypto.createHmac('sha256', SAL_IP).update(String(ip)).digest('hex').slice(0, 40);

module.exports = function criarApp() {
  const app = express();
  app.disable('x-powered-by');
  // Render pone un proxy delante: confiar en 1 salto para leer la IP real.
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

  app.use(helmet({
    contentSecurityPolicy: { useDefaults: false, directives: CSP },
    // tile.openstreetmap.org exige Referer; se envía solo el origen del sitio
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    crossOriginEmbedderPolicy: false,
  }));

  app.get('/healthz', (req, res) => res.json({ ok: true }));

  // ---------------------------------------------------------------- API
  const api = express.Router();

  // CORS / origen: el navegador siempre manda Origin en PUT/DELETE; se acepta solo
  // el propio sitio o los orígenes configurados. Peticiones de otros sitios → 403.
  api.use((req, res, next) => {
    const origem = req.get('origin');
    if (!origem) return next();
    const proprio = `${req.protocol}://${req.get('host')}`;
    const extra = ORIGENS.includes(origem);
    if (origem !== proprio && !extra) return res.status(403).json({ erro: 'origem_no_permitida' });
    if (extra) {
      res.set({
        'Access-Control-Allow-Origin': origem, Vary: 'Origin',
        'Access-Control-Allow-Methods': 'PUT, DELETE', 'Access-Control-Allow-Headers': 'Content-Type, X-Client-Id',
        'Access-Control-Max-Age': '600',
      });
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
  api.use(limite(60 * 1000, 20), limite(24 * 60 * 60 * 1000, 300));
  api.use(express.json({ limit: '200kb', type: 'application/json' }));

  async function limiteBanco(req) {
    return (await supabase.rpc('rate_limit_check', { p_ip: hashIp(req.ip) })) === true;
  }

  // Crear o actualizar una validación (el id lo genera el navegador; reintentos no duplican)
  api.put('/validacoes/:id', async (req, res, next) => {
    try {
      const registro = validarRegistro(req.body, req.params.id);
      if (!(await limiteBanco(req))) return res.status(429).json({ erro: 'muitas_tentativas' });
      await supabase.rpc('submit_validation', { p: registro });
      return res.json({ ok: true });
    } catch (e) { return next(e); }
  });

  // Eliminar: solo el navegador que la creó (X-Client-Id)
  api.delete('/validacoes/:id', async (req, res, next) => {
    try {
      const cliente = req.get('x-client-id') || '';
      if (!UUID.test(req.params.id) || !UUID.test(cliente)) throw new ErroDados('id');
      if (!(await limiteBanco(req))) return res.status(429).json({ erro: 'muitas_tentativas' });
      const apagado = await supabase.rpc('delete_validation', { p_id: req.params.id, p_client: cliente });
      return res.json({ ok: true, apagado: apagado === true });
    } catch (e) { return next(e); }
  });

  api.use((req, res) => res.status(404).json({ erro: 'no_encontrado' }));
  app.use('/api', api);

  // ---------------------------------------------------------------- sitio
  app.use(express.static(PUBLIC, {
    dotfiles: 'ignore',
    // Sitio (HTML, JS, CSS, datos, imágenes): el navegador confirma (ETag) que no cambió antes de
    // usar la copia guardada, así una actualización llega completa. Teselas y librerías: 7 días.
    setHeaders(res, arquivo) {
      if (/[\\/](tiles|vendor)[\\/]/.test(arquivo)) res.set('Cache-Control', 'public, max-age=604800');
      else res.set('Cache-Control', 'no-cache');
    },
  }));
  app.use((req, res) => res.status(404).type('text').send('No encontrado'));

  // ---------------------------------------------------------------- errores (sin detalles internos al cliente)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ErroDados) return res.status(400).json({ erro: 'datos_invalidos', campo: err.campo });
    if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'demasiado_grande' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'json_invalido' });
    if (err.status >= 400 && err.status < 500 && err.status !== 401 && err.status !== 403) {
      console.warn('[api]', err.message);
      return res.status(400).json({ erro: 'datos_rechazados' });
    }
    console.error('[api]', err.message);
    return res.status(503).json({ erro: 'servidor_no_disponible' });
  });

  return app;
};
