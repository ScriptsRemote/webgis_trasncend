/* =============================================================================
   validar.js — revisa cada validación antes de enviarla al banco.
   Solo pasan los campos conocidos, con tipo y tamaño correctos (el banco vuelve
   a revisar todo con restricciones «check»). No se aceptan datos personales:
   del usuario solo llegan la institución y el cargo general.
   ========================================================================== */
'use strict';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Opciones del cuestionario (iguales a public/js/validacao.js y a los «check» de supabase/setup.sql)
const CARGOS = ['tecnico', 'investigador', 'funcionario', 'ong', 'productor', 'estudiante', 'otro'];
const CROPS = ['papa', 'papa_amarga', 'quinua', 'canahua', 'cebada_grano', 'cebada_forrajera', 'avena_forrajera',
  'alfalfa', 'pasto_cultivado', 'haba', 'arveja', 'oca', 'olluco', 'isano', 'tarwi', 'trigo', 'maiz',
  'hortalizas', 'descanso', 'otro', 'no_sabe'];
const RIEGO = ['si', 'no', 'no_sabe'];
const TIPOS_RIEGO = ['superficie', 'aspersion', 'goteo', 'otro', 'no_sabe'];
const FONTES = ['rio', 'lago', 'manantial', 'pozo', 'represa', 'qocha', 'otro', 'no_sabe'];
const COBERTURAS = ['veg_natural', 'pastizal', 'humedal', 'suelo_roca', 'otro'];
const REGIAO = [-74, -22, -64, -12];   // cuenca del Titicaca con margen (igual que en setup.sql)
const MAX_VERTICES = 5000;

class ErroDados extends Error {
  constructor(campo) { super(`campo inválido: ${campo}`); this.campo = campo; }
}
const falha = (campo) => { throw new ErroDados(campo); };

function texto(v, campo, max, obrigatorio) {
  if (v == null || v === '') { if (obrigatorio) falha(campo); return null; }
  if (typeof v !== 'string') falha(campo);
  const s = v.trim();
  if ((obrigatorio && !s) || s.length > max) falha(campo);
  return s || null;
}
function data(v, campo, obrigatorio) {
  if (v == null) { if (obrigatorio) falha(campo); return null; }
  if (typeof v !== 'string' || v.length > 40 || Number.isNaN(Date.parse(v))) falha(campo);
  return new Date(v).toISOString();
}
// Lista de opciones (al menos una, sin repetir); «no_sabe» no se combina con otras
function opcoes(v, validas, campo) {
  if (!Array.isArray(v) || !v.length || v.length > validas.length) falha(campo);
  const u = [...new Set(v)];
  if (u.some((x) => !validas.includes(x)) || (u.includes('no_sabe') && u.length > 1)) falha(campo);
  return u;
}
function posicao(p) {
  if (!Array.isArray(p) || p.length < 2 || p.length > 3) falha('geometry');
  const [x, y] = p;
  if (!Number.isFinite(x) || !Number.isFinite(y)) falha('geometry');
  return [x, y];
}
function geometria(g) {
  if (!g || typeof g !== 'object') falha('geometry');
  if (g.type === 'Point') {
    const [x, y] = posicao(g.coordinates);
    if (x < REGIAO[0] || x > REGIAO[2] || y < REGIAO[1] || y > REGIAO[3]) falha('geometry');
    return { type: 'Point', coordinates: [x, y] };
  }
  if (g.type === 'Polygon') {
    if (!Array.isArray(g.coordinates) || !g.coordinates.length || g.coordinates.length > 50) falha('geometry');
    let n = 0;
    const aneis = g.coordinates.map((anel) => {
      if (!Array.isArray(anel) || anel.length < 4) falha('geometry');
      n += anel.length;
      if (n > MAX_VERTICES) falha('geometry');
      return anel.map(posicao);
    });
    const [x, y] = aneis[0][0];
    if (x < REGIAO[0] || x > REGIAO[2] || y < REGIAO[1] || y > REGIAO[3]) falha('geometry');
    return { type: 'Polygon', coordinates: aneis };
  }
  return falha('geometry');
}

// Devuelve el registro limpio o lanza ErroDados.
function validarRegistro(b, id) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) falha('body');
  if (!UUID.test(id) || b.id !== id) falha('id');
  if (typeof b.client_id !== 'string' || !UUID.test(b.client_id)) falha('client_id');
  if (!CARGOS.includes(b.job_title)) falha('job_title');
  if (typeof b.is_cropland !== 'boolean') falha('is_cropland');
  // Cultivo: cultivos + riego (con tipo y fuente si hay riego). No cultivo: cobertura.
  const cultivo = b.is_cropland;
  const crops = cultivo ? opcoes(b.crops, CROPS, 'crops') : null;
  if (cultivo && !RIEGO.includes(b.irrigation)) falha('irrigation');
  const irrigation = cultivo ? b.irrigation : null;
  if (!cultivo && !COBERTURAS.includes(b.land_cover)) falha('land_cover');
  const landCover = cultivo ? null : b.land_cover;
  return {
    id,
    client_id: b.client_id,
    created_at: data(b.created_at, 'created_at', true),
    updated_at: data(b.updated_at, 'updated_at', true),
    consent_at: data(b.consent_at, 'consent_at', true),
    institution: texto(b.institution, 'institution', 200, true),
    job_title: b.job_title,
    is_cropland: cultivo,
    crops,
    crop_other: crops && crops.includes('otro') ? texto(b.crop_other, 'crop_other', 200, true) : null,
    irrigation,
    irrigation_type: irrigation === 'si' ? opcoes(b.irrigation_type, TIPOS_RIEGO, 'irrigation_type') : null,
    water_source: irrigation === 'si' ? opcoes(b.water_source, FONTES, 'water_source') : null,
    land_cover: landCover,
    land_cover_other: landCover === 'otro' ? texto(b.land_cover_other, 'land_cover_other', 200, true) : null,
    notes: texto(b.notes, 'notes', 2000, false),
    lang: b.lang === 'en' ? 'en' : 'es',
    geometry: geometria(b.geometry),
  };
}

module.exports = { validarRegistro, ErroDados, UUID };
