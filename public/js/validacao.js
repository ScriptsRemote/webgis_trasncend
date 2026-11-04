/* =============================================================================
   validacao.js — TRANSCEND WebGIS
   Validación del mapa de cultivo en campo: el usuario indica su perfil (solo
   institución y cargo general, sin datos personales), marca un punto o dibuja
   un polígono (Leaflet-Geoman) y responde un cuestionario corto:
     1. ¿Es tierra de cultivo? (sí / no)
     sí → cultivos principales (lista, con «no sé») y acceso a riego
          (sí → tipo de riego y fuente del agua · no = secano · no sé)
     no → cobertura del suelo (cuatro clases u «otra», con texto)
   Cada registro se guarda en este navegador y se envía al servidor del sitio
   (/api/validacoes, server/app.js), que lo revisa y lo guarda en Supabase.
   El navegador no tiene ninguna clave. Sin internet el registro queda
   pendiente y se reenvía solo. Cada usuario ve solo sus propias validaciones.
   ========================================================================== */
(function () {
  'use strict';

  const APP = window.TRANSCEND_APP;
  const map = APP.map, esc = APP.esc;
  const T = () => APP.T().val;
  const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);

  const API = 'api/validacoes';
  const configurado = location.protocol !== 'file:';   // abierto sin servidor (doble clic): solo local

  // Opciones (id guardado en la base). Para cambiarlas: aquí, i18n.js, server/validar.js y supabase/setup.sql.
  const CARGOS = ['tecnico', 'investigador', 'funcionario', 'ong', 'productor', 'estudiante', 'otro'];
  const CROPS = ['papa', 'papa_amarga', 'quinua', 'canahua', 'cebada_grano', 'cebada_forrajera', 'avena_forrajera',
    'alfalfa', 'pasto_cultivado', 'haba', 'arveja', 'oca', 'olluco', 'isano', 'tarwi', 'trigo', 'maiz',
    'hortalizas', 'descanso', 'otro', 'no_sabe'];
  const RIEGO = ['si', 'no', 'no_sabe'];
  const TIPOS_RIEGO = ['superficie', 'aspersion', 'goteo', 'otro', 'no_sabe'];
  const FONTES = ['rio', 'lago', 'manantial', 'pozo', 'represa', 'qocha', 'otro', 'no_sabe'];
  const COBERTURAS = ['veg_natural', 'pastizal', 'humedal', 'suelo_roca', 'otro'];
  // Color en el mapa: cultivo según el riego; no cultivo según la cobertura
  const CORES = {
    cult_riego: '#1f78b4', cult_secano: '#e6ab02', cult_nosabe: '#e7298a',
    veg_natural: '#1b7837', pastizal: '#a6d96a', humedal: '#35978f', suelo_roca: '#8c6d4f', otro: '#8a8a8a',
  };
  const categoria = (r) => (r.is_cropland ? ({ si: 'cult_riego', no: 'cult_secano' }[r.irrigation] || 'cult_nosabe') : r.land_cover);
  // Tamaño de los polígonos (ha): se recomienda de 1 a 25; más de 500 no se acepta (tampoco en el servidor ni en el banco)
  const AREA_MIN = 1, AREA_REC = 25, AREA_MAX = 500;

  // ------------------------------------------------------------------ armazenamento local
  const K_USER = 'transcend-webgis:usuario', K_REG = 'transcend-webgis:validaciones', K_CLI = 'transcend-webgis:cliente';
  const ler = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } };
  function uuid() {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* file:// */ }
    const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  // Identificador de este navegador: solo quien creó un registro lo puede editar o eliminar en el servidor.
  let cliente = ler(K_CLI, null);
  if (!cliente) { cliente = uuid(); gravar(K_CLI, cliente); }
  let usuario = ler(K_USER, null);   // { inst, cargo, consentimento }
  let registros = ler(K_REG, []);
  const salvarRegistros = () => gravar(K_REG, registros);

  // Versión anterior (nombre y correo; una sola «clase»): se borran los datos personales de este
  // navegador y las respuestas se pasan al cuestionario nuevo. El perfil se pide de nuevo.
  if (usuario && (usuario.nome || usuario.email || !CARGOS.includes(usuario.cargo))) {
    usuario = { inst: usuario.inst || '', cargo: CARGOS.includes(usuario.cargo) ? usuario.cargo : '' };
    gravar(K_USER, usuario);
  }
  const RIEGO_ANT = { agri_irrigada: 'si', agri_secano: 'no' };
  if (registros.some((r) => r.land_class || r.user_email || !CARGOS.includes(r.job_title))) {
    registros.forEach((r) => {
      if (r.land_class) {
        const agri = r.land_class in RIEGO_ANT, irrigada = r.land_class === 'agri_irrigada';
        Object.assign(r, {
          is_cropland: agri,
          crops: agri ? [r.crop === 'no_ident' ? 'no_sabe' : r.crop] : null,
          crop_other: agri && r.crop === 'otro' ? r.crop_other : null,
          irrigation: agri ? RIEGO_ANT[r.land_class] : null,
          irrigation_type: irrigada ? ['no_sabe'] : null, water_source: irrigada ? ['no_sabe'] : null,
          land_cover: agri ? null : r.land_class, land_cover_other: null,
        });
      }
      delete r.land_class; delete r.crop; delete r.user_name; delete r.user_email;
      if (!CARGOS.includes(r.job_title)) r.job_title = 'otro';
    });
    salvarRegistros();
  }
  const registrado = () => !!(usuario && usuario.consentimento && usuario.inst && CARGOS.includes(usuario.cargo));
  const meus = () => registros.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Superficie geodésica aproximada (ha) para mostrar; la oficial se calcula en PostGIS.
  function areaHa(g) {
    if (g.type !== 'Polygon') return null;
    const R = 6378137, rad = Math.PI / 180;
    const anel = (r) => {
      let s = 0;
      for (let i = 0; i < r.length - 1; i++) s += (r[i + 1][0] - r[i][0]) * rad * (2 + Math.sin(r[i][1] * rad) + Math.sin(r[i + 1][1] * rad));
      return Math.abs(s * R * R / 2);
    };
    return (anel(g.coordinates[0]) - g.coordinates.slice(1).reduce((a, r) => a + anel(r), 0)) / 10000;
  }

  // ------------------------------------------------------------------ servidor (/api)
  const paraServidor = (r) => ({
    id: r.id, client_id: r.client_id, created_at: r.created_at, updated_at: r.updated_at, consent_at: r.consent_at,
    institution: r.institution, job_title: r.job_title,
    is_cropland: r.is_cropland, crops: r.crops, crop_other: r.crop_other,
    irrigation: r.irrigation, irrigation_type: r.irrigation_type, water_source: r.water_source,
    land_cover: r.land_cover, land_cover_other: r.land_cover_other,
    notes: r.notes, lang: r.lang, geometry: r.geometry,
  });
  const enviarServidor = (r) => fetch(`${API}/${r.id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paraServidor(r)),
  });
  async function apagarServidor(r) {
    const res = await fetch(`${API}/${r.id}`, { method: 'DELETE', headers: { 'X-Client-Id': r.client_id } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  // estado: 'borrador' (solo en este aparato, hasta pulsar «Enviar») · 'pendiente' (en la cola de envío)
  //         · 'enviado' · 'rechazado' (el servidor no aceptó los datos)
  let enviando = false, ultimoErro = null;
  async function sincronizar() {
    if (!configurado || enviando) return;
    const fila = registros.filter((r) => r.estado === 'pendiente');
    if (!fila.length) return;
    enviando = true; render();
    try {
      for (const r of fila) {
        const versao = r.updated_at;
        const res = await enviarServidor(r);
        if (res.status === 429) { ultimoErro = T().tooMany; break; }
        if (res.status === 400) { r.estado = 'rechazado'; salvarRegistros(); continue; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        r.noServidor = true;
        if (r.updated_at === versao) r.estado = 'enviado';   // si se editó mientras se enviaba, queda pendiente
        if (!registros.includes(r)) await apagarServidor(r);   // eliminado mientras se enviaba
        salvarRegistros();
        ultimoErro = null;
      }
    } catch (e) {
      ultimoErro = e.message || String(e);
      console.error('validaciones:', e);
    } finally {
      enviando = false; desenharCamada(); render();
    }
  }
  window.addEventListener('online', sincronizar);
  setInterval(() => { if (navigator.onLine) sincronizar(); }, 120000);

  // Botón «Enviar»: los borradores del usuario pasan a la cola y se envían
  function enviarRascunhos() {
    meus().forEach((r) => { if (r.estado === 'borrador') r.estado = 'pendiente'; });
    salvarRegistros(); desenharCamada(); render(); sincronizar();
  }
  // Aviso del navegador al cerrar la página con borradores sin enviar
  window.addEventListener('beforeunload', (e) => {
    if (registros.some((r) => r.estado === 'borrador')) { e.preventDefault(); e.returnValue = ''; }
  });

  async function apagar(id) {
    const r = registros.find((x) => x.id === id);
    if (!r || !confirm(T().confirmDelete)) return;
    if (configurado && r.noServidor) {
      try { await apagarServidor(r); } catch (e) { alert(T().deleteFail); return; }
    }
    registros = registros.filter((x) => x !== r);
    salvarRegistros(); map.closePopup(); desenharCamada(); render();
  }

  // ------------------------------------------------------------------ camada no mapa
  map.createPane('valid'); map.getPane('valid').style.zIndex = 450;
  const rend = L.svg({ pane: 'valid' });
  const camada = L.featureGroup().addTo(map);
  const rotuloEstado = (r) => T().st[r.estado === 'borrador' ? 'draft' : !configurado ? 'local'
    : r.estado === 'enviado' ? 'sent' : r.estado === 'rechazado' ? 'rejected' : 'pending'];
  const rotuloCultivos = (r) => (r.crops || []).map((k) => (k === 'otro' && r.crop_other ? r.crop_other : T().crops[k])).join(', ');
  const rotuloCobertura = (r) => (r.land_cover === 'otro' && r.land_cover_other ? r.land_cover_other : T().covers[r.land_cover]);
  // Resumen en una línea: «Cultivo con riego · Papa, Quinua» / «Pastizal / pastos»
  const resumo = (r) => (r.is_cropland ? `${T().cats[categoria(r)]} · ${rotuloCultivos(r)}` : rotuloCobertura(r));

  function popupHtml(r) {
    const t = T(), g = r.geometry, lista = (ks, rot) => (ks || []).map((k) => rot[k]).join(', ');
    return `<div class="pp-tipo">${esc(t.myValidation)} · ${esc(g.type === 'Point' ? t.point : t.polygon)}</div>
      <div class="pp-tit">${esc(t.cats[categoria(r)])}</div>` + APP.kv([
      [t.isCropLabel, esc(r.is_cropland ? t.yes : t.no)],
      [t.cropsLabel, r.is_cropland ? esc(rotuloCultivos(r)) : null],
      [t.irrigationLabel, r.is_cropland ? esc(t.irrigation[r.irrigation]) : null],
      [t.qIrrType, esc(lista(r.irrigation_type, t.irrTypes))],
      [t.qSource, esc(lista(r.water_source, t.sources))],
      [t.coverLabel, r.is_cropland ? null : esc(rotuloCobertura(r))],
      [t.area, g.type === 'Polygon' ? `${APP.nf(areaHa(g), 2)} ha` : null],
      [t.notes, esc(r.notes)],
      [t.created, esc(new Date(r.created_at).toLocaleString(APP.lang() === 'es' ? 'es-PE' : 'en-GB'))],
      [t.status, esc(rotuloEstado(r))],
    ]) + `<div class="pp-acoes">
        <button type="button" class="btn btn-sec" data-val-editar="${r.id}">${esc(t.edit)}</button>
        <button type="button" class="btn btn-sec" data-val-apagar="${r.id}">${esc(t.del)}</button></div>`;
  }
  function desenharCamada() {
    camada.clearLayers();
    meus().forEach((r) => {
      const cor = CORES[categoria(r)] || '#999';
      const pendente = r.estado !== 'enviado';
      const borda = r.estado === 'rechazado' ? '#d7191c' : r.estado === 'borrador' ? '#9aa0a6' : pendente ? '#ffcc33' : '#fff';
      const l = L.geoJSON(r.geometry, {
        pane: 'valid', renderer: rend, bubblingMouseEvents: false,
        pointToLayer: (f, ll) => L.circleMarker(ll, { pane: 'valid', renderer: rend, bubblingMouseEvents: false,
          radius: 7, color: borda, weight: 2.5, fillColor: cor, fillOpacity: 1 }),
        style: { color: cor, weight: 2.5, fillColor: cor, fillOpacity: 0.35, dashArray: pendente ? '6 4' : null },
      });
      l.bindPopup(() => popupHtml(r), { maxWidth: 320 });
      l._valId = r.id;
      camada.addLayer(l);
    });
  }
  map.on('popupopen', (e) => {
    const el = e.popup.getElement();
    el.querySelectorAll('[data-val-editar]').forEach((b) => b.addEventListener('click', () => {
      const r = registros.find((x) => x.id === b.dataset.valEditar);
      map.closePopup(); if (r) abrirFormulario(r);
    }));
    el.querySelectorAll('[data-val-apagar]').forEach((b) => b.addEventListener('click', () => apagar(b.dataset.valApagar)));
  });
  function mostrar(id) {
    const l = camada.getLayers().find((x) => x._valId === id);
    if (!l) return;
    const b = l.getBounds();
    if (b.getNorthEast().equals(b.getSouthWest())) map.setView(b.getCenter(), Math.max(map.getZoom(), 16));
    else map.fitBounds(b, { padding: [40, 40], maxZoom: 17 });
    l.openPopup(b.getCenter());
  }

  // ------------------------------------------------------------------ desenho (Leaflet-Geoman)
  map.pm.setGlobalOptions({
    allowSelfIntersection: false, snappable: false, continueDrawing: false,
    panes: { layerPane: 'valid', vertexPane: 'markerPane', markerPane: 'markerPane' },
    templineStyle: { color: '#ffcc33', weight: 2.5 }, hintlineStyle: { color: '#ffcc33', dashArray: '5,5' },
    pathOptions: { color: '#ffcc33', weight: 2.5, fillColor: '#ffcc33', fillOpacity: 0.25, radius: 7 },
  });
  const barra = document.getElementById('barra-desenho');
  let modo = null, formAberto = false, temp = null;

  function desenhar(tipo) {
    if (!registrado()) { abrirUsuario(() => desenhar(tipo)); return; }
    parar();
    modo = tipo; map._bloquearConsulta = true;
    map.pm.enableDraw(tipo === 'ponto' ? 'CircleMarker' : 'Polygon');
    renderBarra();
  }
  function parar() {
    if (map.pm.globalDrawModeEnabled()) map.pm.disableDraw();
    modo = null; renderBarra();
    if (!formAberto) map._bloquearConsulta = false;
  }
  map.on('pm:drawend', () => { modo = null; renderBarra(); if (!formAberto) setTimeout(() => { map._bloquearConsulta = formAberto; }, 0); });
  map.on('pm:create', (e) => {
    const g = e.layer.toGeoJSON().geometry;
    if (g.type === 'Polygon' && areaHa(g) > AREA_MAX) {   // polígono demasiado grande: se descarta y se dibuja de nuevo
      map.removeLayer(e.layer);
      alert(fmt(T().tooBig, { a: APP.nf(areaHa(g), 1), max: AREA_MAX }));
      setTimeout(() => desenhar('poligono'), 0);
      return;
    }
    temp = e.layer;
    abrirFormulario(null, g);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modo && !formAberto) parar(); });

  function renderBarra() {
    if (!modo) { barra.hidden = true; return; }
    const t = T();
    barra.innerHTML = `<span>${esc(modo === 'ponto' ? t.hintPoint : t.hintPolygon)}</span>
      ${modo === 'poligono' ? `<button type="button" class="btn btn-sec" data-b="desfazer">${esc(t.undo)}</button>
        <button type="button" class="btn" data-b="terminar">${esc(t.finish)}</button>` : ''}
      <button type="button" class="btn btn-sec" data-b="cancelar">${esc(t.cancel)}</button>`;
    barra.hidden = false;
  }
  L.DomEvent.disableClickPropagation(barra);
  barra.addEventListener('click', (e) => {
    const b = e.target.closest('[data-b]'); if (!b) return;
    const d = map.pm.Draw.Polygon;
    if (b.dataset.b === 'cancelar') parar();
    else if (b.dataset.b === 'desfazer' && d._removeLastVertex) d._removeLastVertex();
    else if (b.dataset.b === 'terminar' && d._finishShape) d._finishShape();
  });

  // Botones en el mapa (útiles en el celular, con el menú recogido)
  const ICON_PONTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.3"/></svg>';
  const ICON_POL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7.5l9-3.5 6 8-5 8-10-3.5z" stroke-linejoin="round"/><circle cx="5" cy="7.5" r="1.7" fill="currentColor"/><circle cx="14" cy="4" r="1.7" fill="currentColor"/><circle cx="20" cy="12" r="1.7" fill="currentColor"/><circle cx="15" cy="20" r="1.7" fill="currentColor"/><circle cx="5" cy="16.5" r="1.7" fill="currentColor"/></svg>';
  const ICON_ENVIAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  const CtrlVal = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const d = L.DomUtil.create('div', 'leaflet-bar ctrl-val');
      d.innerHTML = `<a href="#" role="button" data-tipo="ponto">${ICON_PONTO}</a><a href="#" role="button" data-tipo="poligono">${ICON_POL}</a>`;
      d.querySelectorAll('a').forEach((a) => L.DomEvent.on(a, 'click', (e) => { L.DomEvent.preventDefault(e); desenhar(a.dataset.tipo); }));
      L.DomEvent.disableClickPropagation(d);
      this._d = d;
      return d;
    },
    titulos() {
      const t = T();
      this._d.querySelectorAll('a').forEach((a) => {
        const s = a.dataset.tipo === 'ponto' ? t.ctrlPoint : t.ctrlPolygon;
        a.title = s; a.setAttribute('aria-label', s);
      });
    },
  });
  const ctrlVal = new CtrlVal().addTo(map);

  // ------------------------------------------------------------------ diálogos
  function criarDialogo(id) {
    const d = document.createElement('dialog');
    d.id = id; d.className = 'dlg';
    document.body.appendChild(d);
    return d;
  }
  const dlgUser = criarDialogo('dlg-usuario'), dlgVal = criarDialogo('dlg-validacao');
  const NAO_VAZIO = 'pattern=".*\\S.*"';

  function abrirUsuario(depois) {
    const t = T(), u = usuario || {};
    const opt = (v, rot, sel) => `<option value="${v}"${sel ? ' selected' : ''}>${esc(rot)}</option>`;
    dlgUser.innerHTML = `<form class="form-val">
      <h3>${esc(t.userTitle)}</h3>
      <p class="form-sub">${esc(t.userIntro)}</p>
      <label class="campo">${esc(t.institution)} *<input name="inst" required ${NAO_VAZIO} maxlength="200" autocomplete="organization" placeholder="${esc(t.institutionPh)}" value="${esc(u.inst || '')}"></label>
      <label class="campo">${esc(t.role)} *<select name="cargo" required>${opt('', t.choose)}
        ${CARGOS.map((k) => opt(k, t.roles[k], u.cargo === k)).join('')}</select></label>
      <p class="form-nota">${esc(t.privacy)}</p>
      <label class="campo-check"><input type="checkbox" name="aceite" required${u.consentimento ? ' checked' : ''}>
        <span>${esc(t.consent)} *</span></label>
      <div class="form-acoes">
        <button type="button" class="btn btn-sec" data-fechar>${esc(t.cancel)}</button>
        <button type="submit" class="btn">${esc(t.saveUser)}</button>
      </div></form>`;
    const f = dlgUser.querySelector('form');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      usuario = { inst: v.inst.trim(), cargo: v.cargo,
        consentimento: new Date().toISOString() };   // fecha del consentimiento (va con cada validación)
      gravar(K_USER, usuario);
      dlgUser.close(); desenharCamada(); render();
      if (depois) depois();
    });
    dlgUser.querySelector('[data-fechar]').addEventListener('click', () => dlgUser.close());
    dlgUser.showModal();
  }

  // Grupos de opciones del cuestionario. «no_sabe» excluye las demás opciones del mismo grupo.
  const radios = (nome, ops, rot, sel) => `<div class="opcoes">${ops.map((k) => `<label class="opcao"><input type="radio" name="${nome}" value="${k}" required${sel === k ? ' checked' : ''}><span>${esc(rot[k])}</span></label>`).join('')}</div>`;
  const checks = (nome, ops, rot, sel, grade) => `<div class="opcoes${grade ? ' opcoes-grade' : ''}" data-grupo="${nome}">${ops.map((k) => `<label class="opcao"><input type="checkbox" name="${nome}" value="${k}"${(sel || []).includes(k) ? ' checked' : ''}><span>${esc(rot[k])}</span></label>`).join('')}</div>`;

  // r: registro existente (editar) o null (nuevo, con la geometría recién dibujada)
  function abrirFormulario(r, geom) {
    const t = T(), g = r ? r.geometry : geom, x = r || {};
    formAberto = true; map._bloquearConsulta = true;
    const ha = areaHa(g);
    const sub = g.type === 'Point'
      ? `${t.point} · ${g.coordinates[1].toFixed(5)}, ${g.coordinates[0].toFixed(5)}`
      : `${t.polygon} · ${APP.nf(ha, 2)} ha`;
    const aviso = g.type !== 'Polygon' ? '' : ha < AREA_MIN ? t.sizeSmall : ha > AREA_REC ? t.sizeLarge : '';
    const simNao = r ? (x.is_cropland ? 'si' : 'no') : null;
    dlgVal.innerHTML = `<form class="form-val">
      <h3>${esc(r ? t.editTitle : t.newTitle)}</h3>
      <p class="form-sub">${esc(sub)}</p>
      ${aviso ? `<p class="form-aviso">${esc(fmt(aviso, { a: APP.nf(ha, 1) }))}</p>` : ''}
      <fieldset class="perg"><legend>1. ${esc(t.qCrop)} *</legend>
        ${radios('is_crop', ['si', 'no'], { si: t.yes, no: t.no }, simNao)}</fieldset>
      <fieldset class="bloco" data-bloco="si">
        <fieldset class="perg"><legend>2. ${esc(t.qCrops)} *</legend>
          <p class="perg-ajuda">${esc(t.multiHelp)}</p>
          ${checks('crops', CROPS, t.crops, x.crops, true)}
          <label class="campo" data-outro="crops">${esc(t.cropOther)} *<input name="crop_other" required maxlength="200" ${NAO_VAZIO} value="${esc(x.crop_other || '')}"></label>
        </fieldset>
        <fieldset class="perg"><legend>3. ${esc(t.qIrrigation)} *</legend>
          ${radios('irrigation', RIEGO, t.irrigation, x.irrigation)}
          <fieldset class="bloco bloco-sub" data-bloco="riego">
            <fieldset class="perg"><legend>${esc(t.qIrrType)} *</legend>
              ${checks('irrigation_type', TIPOS_RIEGO, t.irrTypes, x.irrigation_type)}</fieldset>
            <fieldset class="perg"><legend>${esc(t.qSource)} *</legend>
              ${checks('water_source', FONTES, t.sources, x.water_source)}</fieldset>
          </fieldset>
        </fieldset>
      </fieldset>
      <fieldset class="bloco" data-bloco="no">
        <fieldset class="perg"><legend>2. ${esc(t.qCover)} *</legend>
          ${radios('land_cover', COBERTURAS, t.covers, x.land_cover)}
          <label class="campo" data-outro="land_cover">${esc(t.coverOther)} *<input name="land_cover_other" required maxlength="200" ${NAO_VAZIO} value="${esc(x.land_cover_other || '')}"></label>
        </fieldset>
      </fieldset>
      <label class="campo">${esc(t.notes)}<textarea name="obs" rows="2" maxlength="2000" placeholder="${esc(t.notesPh)}">${esc(x.notes || '')}</textarea></label>
      <div class="form-acoes">
        <button type="button" class="btn btn-sec" data-fechar>${esc(t.cancel)}</button>
        <button type="submit" class="btn">${esc(t.save)}</button>
      </div></form>`;
    const f = dlgVal.querySelector('form');
    const marcados = (nome) => [...f.querySelectorAll(`input[name="${nome}"]:checked`)].map((i) => i.value);
    const escolha = (nome) => (f.querySelector(`input[name="${nome}"]:checked`) || {}).value || null;
    // Muestra solo las preguntas que corresponden; las ocultas quedan deshabilitadas (no se validan)
    const mostrarSe = (el, sim) => { el.hidden = !sim; (el.matches('fieldset') ? el : el.querySelector('input')).disabled = !sim; };
    function sync() {
      const sim = escolha('is_crop') === 'si', nao = escolha('is_crop') === 'no';
      mostrarSe(f.querySelector('[data-bloco="si"]'), sim);
      mostrarSe(f.querySelector('[data-bloco="no"]'), nao);
      mostrarSe(f.querySelector('[data-bloco="riego"]'), sim && escolha('irrigation') === 'si');
      mostrarSe(f.querySelector('[data-outro="crops"]'), sim && marcados('crops').includes('otro'));
      mostrarSe(f.querySelector('[data-outro="land_cover"]'), nao && escolha('land_cover') === 'otro');
      f.querySelectorAll('[data-grupo]').forEach((gr) => {   // al menos una opción marcada en cada grupo visible
        const primeiro = gr.querySelector('input');
        primeiro.setCustomValidity(primeiro.disabled || gr.querySelector('input:checked') ? '' : t.pickOne);
      });
    }
    f.addEventListener('change', (e) => {
      const i = e.target;
      if (i.type === 'checkbox' && i.checked) {
        f.querySelectorAll(`input[name="${i.name}"]`).forEach((o) => {
          if (o !== i && (i.value === 'no_sabe' || o.value === 'no_sabe')) o.checked = false;
        });
      }
      sync();
    });
    sync();

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const sim = escolha('is_crop') === 'si', agora = new Date().toISOString();
      const crops = sim ? marcados('crops') : null, irr = sim ? escolha('irrigation') : null;
      const cob = sim ? null : escolha('land_cover');
      const dados = {
        is_cropland: sim,
        crops,
        crop_other: sim && crops.includes('otro') ? f.crop_other.value.trim() : null,
        irrigation: irr,
        irrigation_type: irr === 'si' ? marcados('irrigation_type') : null,
        water_source: irr === 'si' ? marcados('water_source') : null,
        land_cover: cob,
        land_cover_other: cob === 'otro' ? f.land_cover_other.value.trim() : null,
        notes: f.obs.value.trim() || null,
        updated_at: agora, estado: 'borrador',   // se envía solo con el botón «Enviar»
      };
      if (r) Object.assign(r, dados, { consent_at: r.consent_at || usuario.consentimento });
      else {
        registros.push(Object.assign({
          id: uuid(), client_id: cliente, created_at: agora, consent_at: usuario.consentimento,
          institution: usuario.inst, job_title: usuario.cargo,
          geometry: g, lang: APP.lang(),
        }, dados));
      }
      salvarRegistros(); dlgVal.close();
    });
    dlgVal.querySelector('[data-fechar]').addEventListener('click', () => dlgVal.close());
    dlgVal.onclose = () => {
      formAberto = false;
      if (temp) { map.removeLayer(temp); temp = null; }
      setTimeout(() => { map._bloquearConsulta = !!modo; }, 0);
      desenharCamada(); render();
    };
    dlgVal.showModal();
  }

  // ------------------------------------------------------------------ painel "Validar"
  const corpo = document.getElementById('validar-corpo');
  let guiaAberta = null;   // null = abierta mientras no haya validaciones
  function render() {
    const t = T(), lista = meus(), pend = registros.filter((r) => r.estado === 'pendiente').length;
    const rejeitados = lista.filter((r) => r.estado === 'rechazado').length;
    const rascunhos = lista.filter((r) => r.estado === 'borrador').length;
    // Bloque de envío: aviso de borradores + botón «Enviar validaciones (n)»
    const envio = rascunhos && configurado ? `<div class="val-envio">
        <p>${esc(fmt(t.draftsN, { n: rascunhos }))}</p>
        <button type="button" class="btn" data-acao="enviar-rascunhos"${enviando ? ' disabled' : ''}>${ICON_ENVIAR}<span>${esc(fmt(t.sendDrafts, { n: rascunhos }))}</span></button>
      </div>` : '';
    let estado;
    if (!configurado) estado = `<div class="val-estado is-aviso">${esc(t.localOnly)}</div>`;
    else if (enviando) estado = `<div class="val-estado">${esc(t.sending)}</div>`;
    else if (rejeitados) estado = `<div class="val-estado is-erro">${esc(fmt(t.rejectedN, { n: rejeitados }))}</div>`;
    else if (pend) {
      estado = `<div class="val-estado is-aviso">${esc(fmt(t.pendingN, { n: pend }))}
        ${ultimoErro ? `<br><small>${esc(fmt(t.sendError, { e: ultimoErro }))}</small>` : ''}
        <button type="button" class="link-btn" data-acao="enviar">${esc(t.sendNow)}</button></div>`;
    } else estado = lista.length && !rascunhos ? `<div class="val-estado is-ok">${esc(t.allSent)}</div>` : '';
    const guiaOn = guiaAberta == null ? !lista.length : guiaAberta;

    corpo.innerHTML = `
      <h3 class="val-h">${esc(t.title)}</h3>
      <p class="val-intro">${esc(t.intro)}</p>
      <div class="val-usuario">${registrado() ? `
        <div class="val-usuario-topo"><div><b>${esc(usuario.inst)}</b><span>${esc(t.roles[usuario.cargo])}</span></div>
          <button type="button" class="link-btn" data-acao="usuario">${esc(t.change)}</button></div>` : `
        <p>${esc(t.needUser)}</p><button type="button" class="btn" data-acao="usuario">${esc(t.register)}</button>`}
      </div>
      <details class="val-guia"${guiaOn ? ' open' : ''}><summary>${esc(t.guideTitle)}</summary>${t.guide}</details>
      <div class="val-ferr">
        <button type="button" class="btn" data-acao="ponto">${ICON_PONTO}<span>${esc(t.drawPoint)}</span></button>
        <button type="button" class="btn btn-sec" data-acao="poligono">${ICON_POL}<span>${esc(t.drawPolygon)}</span></button>
      </div>
      ${envio}
      ${estado}
      <h4 class="val-tit">${esc(t.mine)} (${lista.length})</h4>
      ${lista.length ? `<ul class="val-lista">${lista.map((r) => `
        <li class="val-item" data-id="${r.id}" title="${esc(t.zoom)}">
          <span class="sw${r.geometry.type === 'Point' ? ' ponto' : ''}" style="background:${CORES[categoria(r)]}"></span>
          <span class="val-item-txt"><b>${esc(resumo(r))}</b>
            <small>${esc(r.geometry.type === 'Point' ? t.point : t.polygon)} · ${esc(new Date(r.created_at).toLocaleDateString(APP.lang() === 'es' ? 'es-PE' : 'en-GB'))}</small></span>
          ${r.estado !== 'enviado' ? `<span class="val-pend${r.estado === 'rechazado' ? ' is-erro' : r.estado === 'borrador' ? ' is-rascunho' : ''}" title="${esc(rotuloEstado(r))}"></span>` : ''}
        </li>`).join('')}</ul>
        <button type="button" class="btn btn-sec" data-acao="baixar">${esc(t.download)}</button>`
        : `<p class="val-vazio">${esc(t.none)}</p>`}
      <h4 class="val-tit val-tit-leg">${esc(t.legend)}</h4>
      <ul class="legend-classes val-leg">${Object.keys(CORES).map((k) => `<li class="legend-class"><span class="sw" style="background:${CORES[k]}"></span><span>${esc(t.cats[k])}</span></li>`).join('')}</ul>`;
  }
  corpo.addEventListener('click', (e) => {
    const s = e.target.closest('.val-guia > summary');
    if (s) { guiaAberta = !s.parentElement.open; return; }   // el clic abre o cierra la guía después de este evento
    const a = e.target.closest('[data-acao]');
    if (a) {
      const acao = a.dataset.acao;
      if (acao === 'usuario') abrirUsuario();
      else if (acao === 'ponto' || acao === 'poligono') desenhar(acao);
      else if (acao === 'enviar') sincronizar();
      else if (acao === 'enviar-rascunhos') enviarRascunhos();
      else if (acao === 'baixar') baixar();
      return;
    }
    const li = e.target.closest('.val-item');
    if (li) mostrar(li.dataset.id);
  });

  function baixar() {
    const t = T();
    const fc = { type: 'FeatureCollection', features: meus().map((r) => ({ type: 'Feature', geometry: r.geometry, properties: {
      id: r.id, category: categoria(r), category_label: t.cats[categoria(r)],
      is_cropland: r.is_cropland, crops: r.crops, crop_other: r.crop_other,
      irrigation: r.irrigation, irrigation_type: r.irrigation_type, water_source: r.water_source,
      land_cover: r.land_cover, land_cover_other: r.land_cover_other, notes: r.notes,
      area_ha: r.geometry.type === 'Polygon' ? +areaHa(r.geometry).toFixed(4) : null,
      institution: r.institution, job_title: r.job_title,
      created_at: r.created_at, updated_at: r.updated_at,
    } })) };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(fc, null, 1)], { type: 'application/geo+json' }));
    a.download = `validaciones_transcend_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ------------------------------------------------------------------ idioma e início
  function aplicarIdioma() {
    map.pm.setLang(APP.lang() === 'es' ? 'es' : 'en');
    ctrlVal.titulos(); renderBarra(); render();
  }
  document.addEventListener('transcend:lang', aplicarIdioma);
  aplicarIdioma();
  desenharCamada();
  sincronizar();
}());
