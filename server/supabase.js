/* =============================================================================
   supabase.js — acceso al banco (solo en el servidor).
   La clave secreta viene de variables de entorno de Render (panel del servicio)
   o del archivo .env local; nunca va al navegador ni al GitHub.
   ========================================================================== */
'use strict';

const URL_DB = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const CHAVE = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const configurado = Boolean(URL_DB && CHAVE);

if (URL_DB && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(URL_DB)) {
  console.warn('[supabase] SUPABASE_URL no parece una URL de proyecto Supabase (https://xxxx.supabase.co)');
}

// Llama a una función SQL (PostgREST /rpc). Los errores no llevan los datos enviados
// (el «details» de PostgREST repite la fila, con datos personales: no se registra).
async function rpc(fn, corpo) {
  if (!configurado) {
    const e = new Error('Supabase no configurado (SUPABASE_URL / SUPABASE_SECRET_KEY)');
    e.status = 503;
    throw e;
  }
  const h = { 'Content-Type': 'application/json', apikey: CHAVE };
  if (CHAVE.startsWith('eyJ')) h.Authorization = `Bearer ${CHAVE}`;   // clave service_role antigua (JWT)
  const res = await fetch(`${URL_DB}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: h, body: JSON.stringify(corpo), signal: AbortSignal.timeout(10000),
  });
  const txt = await res.text();
  if (!res.ok) {
    let info = {};
    try { info = JSON.parse(txt); } catch (e) { /* */ }
    const e = new Error(`Supabase ${fn}: HTTP ${res.status} ${info.code || ''} ${info.message || ''}`.trim());
    e.status = res.status;
    throw e;
  }
  return txt ? JSON.parse(txt) : null;
}

module.exports = { rpc, configurado, CHAVE };
