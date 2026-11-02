/* =============================================================================
   validacao.js — TRANSCEND WebGIS
   Validación de la cobertura en campo: el usuario se registra (nombre, correo,
   institución, cargo), marca un punto o dibuja un polígono (Leaflet-Geoman) y
   elige la clase y, si es agricultura, el cultivo.
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

  // Clases (id guardado en la base → color en el mapa) y cultivos
  const CLASSES = {
    agri_irrigada: '#1f78b4', agri_secano: '#e6ab02', veg_natural: '#1b7837',
    pastizal: '#a6d96a', humedal: '#35978f', suelo_roca: '#8c6d4f',
  };
  const AGRI = new Set(['agri_irrigada', 'agri_secano']);
  const CROPS = ['papa', 'papa_amarga', 'quinua', 'canahua', 'cebada_grano', 'cebada_forrajera', 'avena_forrajera',
    'alfalfa', 'pasto_cultivado', 'haba', 'arveja', 'oca', 'olluco', 'isano', 'tarwi', 'trigo', 'maiz',
    'hortalizas', 'descanso', 'no_ident', 'otro'];

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
  let usuario = ler(K_USER, null);   // { nome, email, inst, cargo }
  let registros = ler(K_REG, []);
  const salvarRegistros = () => gravar(K_REG, registros);
  const meus = () => (usuario ? registros.filter((r) => r.user_email === usuario.email) : [])
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

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
    user_name: r.user_name, user_email: r.user_email, institution: r.institution, job_title: r.job_title,
    land_class: r.land_class, crop: r.crop, crop_other: r.crop_other, notes: r.notes, lang: r.lang, geometry: r.geometry,
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
  const rotuloCultivo = (r) => (r.crop === 'otro' && r.crop_other ? r.crop_other : r.crop ? T().crops[r.crop] : '');

  function popupHtml(r) {
    const t = T(), g = r.geometry;
    return `<div class="pp-tipo">${esc(t.myValidation)} · ${esc(g.type === 'Point' ? t.point : t.polygon)}</div>
      <div class="pp-tit">${esc(t.classes[r.land_class])}</div>` + APP.kv([
      [t.cropLabel, esc(rotuloCultivo(r))],
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
      const cor = CLASSES[r.land_class] || '#999';
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
    if (!usuario || !usuario.consentimento) { abrirUsuario(() => desenhar(tipo)); return; }
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
    temp = e.layer;
    abrirFormulario(null, e.layer.toGeoJSON().geometry);
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
    dlgUser.innerHTML = `<form class="form-val">
      <h3>${esc(t.userTitle)}</h3>
      <p class="form-sub">${esc(t.userIntro)}</p>
      <label class="campo">${esc(t.name)} *<input name="nome" required ${NAO_VAZIO} maxlength="200" autocomplete="name" value="${esc(u.nome || '')}"></label>
      <label class="campo">${esc(t.email)} *<input name="email" type="email" required maxlength="254" autocomplete="email" value="${esc(u.email || '')}"></label>
      <label class="campo">${esc(t.institution)} *<input name="inst" required ${NAO_VAZIO} maxlength="200" autocomplete="organization" value="${esc(u.inst || '')}"></label>
      <label class="campo">${esc(t.role)} *<input name="cargo" required ${NAO_VAZIO} maxlength="200" autocomplete="organization-title" value="${esc(u.cargo || '')}"></label>
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
      usuario = { nome: v.nome.trim(), email: v.email.trim().toLowerCase(), inst: v.inst.trim(), cargo: v.cargo.trim(),
        consentimento: new Date().toISOString() };   // fecha del consentimiento (va con cada validación)
      gravar(K_USER, usuario);
      dlgUser.close(); desenharCamada(); render();
      if (depois) depois();
    });
    dlgUser.querySelector('[data-fechar]').addEventListener('click', () => dlgUser.close());
    dlgUser.showModal();
  }

  // r: registro existente (editar) o null (nuevo, con la geometría recién dibujada)
  function abrirFormulario(r, geom) {
    const t = T(), g = r ? r.geometry : geom;
    formAberto = true; map._bloquearConsulta = true;
    const sub = g.type === 'Point'
      ? `${t.point} · ${g.coordinates[1].toFixed(5)}, ${g.coordinates[0].toFixed(5)}`
      : `${t.polygon} · ${APP.nf(areaHa(g), 2)} ha`;
    const opt = (v, rot, sel) => `<option value="${v}"${sel ? ' selected' : ''}>${esc(rot)}</option>`;
    dlgVal.innerHTML = `<form class="form-val">
      <h3>${esc(r ? t.editTitle : t.newTitle)}</h3>
      <p class="form-sub">${esc(sub)}</p>
      <label class="campo">${esc(t.classLabel)} *<select name="classe" required>${opt('', t.choose)}
        ${Object.keys(CLASSES).map((k) => opt(k, t.classes[k], r && r.land_class === k)).join('')}</select></label>
      <div class="campo-cultivo">
        <label class="campo">${esc(t.cropLabel)} *<select name="cultivo">${opt('', t.choose)}
          ${CROPS.map((k) => opt(k, t.crops[k], r && r.crop === k)).join('')}</select></label>
        <label class="campo campo-outro">${esc(t.cropOther)} *<input name="outro" maxlength="200" ${NAO_VAZIO} value="${esc((r && r.crop_other) || '')}"></label>
      </div>
      <label class="campo">${esc(t.notes)}<textarea name="obs" rows="3" maxlength="2000" placeholder="${esc(t.notesPh)}">${esc((r && r.notes) || '')}</textarea></label>
      <div class="form-acoes">
        <button type="button" class="btn btn-sec" data-fechar>${esc(t.cancel)}</button>
        <button type="submit" class="btn">${esc(t.save)}</button>
      </div></form>`;
    const f = dlgVal.querySelector('form');
    const boxCult = f.querySelector('.campo-cultivo'), boxOutro = f.querySelector('.campo-outro');
    function sync() {
      const agri = AGRI.has(f.classe.value), outro = agri && f.cultivo.value === 'otro';
      boxCult.hidden = !agri; f.cultivo.required = agri;
      boxOutro.hidden = !outro; f.outro.required = outro;
    }
    f.classe.addEventListener('change', sync); f.cultivo.addEventListener('change', sync); sync();

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const agri = AGRI.has(f.classe.value), agora = new Date().toISOString();
      const dados = {
        land_class: f.classe.value,
        crop: agri ? f.cultivo.value : null,
        crop_other: agri && f.cultivo.value === 'otro' ? f.outro.value.trim() : null,
        notes: f.obs.value.trim() || null,
        updated_at: agora, estado: 'borrador',   // se envía solo con el botón «Enviar»
      };
      if (r) Object.assign(r, dados, { consent_at: r.consent_at || usuario.consentimento });
      else {
        registros.push(Object.assign({
          id: uuid(), client_id: cliente, created_at: agora, consent_at: usuario.consentimento,
          user_name: usuario.nome, user_email: usuario.email, institution: usuario.inst, job_title: usuario.cargo,
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

    corpo.innerHTML = `
      <h3 class="val-h">${esc(t.title)}</h3>
      <p class="val-intro">${esc(t.intro)}</p>
      <div class="val-usuario">${usuario ? `
        <div class="val-usuario-topo"><div><b>${esc(usuario.nome)}</b><span>${esc(usuario.email)}</span>
          <span>${esc(usuario.inst)} · ${esc(usuario.cargo)}</span></div>
          <button type="button" class="link-btn" data-acao="usuario">${esc(t.change)}</button></div>` : `
        <p>${esc(t.needUser)}</p><button type="button" class="btn" data-acao="usuario">${esc(t.register)}</button>`}
      </div>
      <div class="val-ferr">
        <button type="button" class="btn" data-acao="ponto">${ICON_PONTO}<span>${esc(t.drawPoint)}</span></button>
        <button type="button" class="btn" data-acao="poligono">${ICON_POL}<span>${esc(t.drawPolygon)}</span></button>
      </div>
      ${envio}
      ${estado}
      <h4 class="val-tit">${esc(t.mine)} (${lista.length})</h4>
      ${lista.length ? `<ul class="val-lista">${lista.map((r) => `
        <li class="val-item" data-id="${r.id}" title="${esc(t.zoom)}">
          <span class="sw${r.geometry.type === 'Point' ? ' ponto' : ''}" style="background:${CLASSES[r.land_class]}"></span>
          <span class="val-item-txt"><b>${esc(t.classes[r.land_class])}${r.crop ? ' · ' + esc(rotuloCultivo(r)) : ''}</b>
            <small>${esc(r.geometry.type === 'Point' ? t.point : t.polygon)} · ${esc(new Date(r.created_at).toLocaleDateString(APP.lang() === 'es' ? 'es-PE' : 'en-GB'))}</small></span>
          ${r.estado !== 'enviado' ? `<span class="val-pend${r.estado === 'rechazado' ? ' is-erro' : r.estado === 'borrador' ? ' is-rascunho' : ''}" title="${esc(rotuloEstado(r))}"></span>` : ''}
        </li>`).join('')}</ul>
        <button type="button" class="btn btn-sec" data-acao="baixar">${esc(t.download)}</button>`
        : `<p class="val-vazio">${esc(t.none)}</p>`}
      <h4 class="val-tit val-tit-leg">${esc(t.legend)}</h4>
      <ul class="legend-classes val-leg">${Object.keys(CLASSES).map((k) => `<li class="legend-class"><span class="sw" style="background:${CLASSES[k]}"></span><span>${esc(t.classes[k])}</span></li>`).join('')}</ul>`;
  }
  corpo.addEventListener('click', (e) => {
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
      id: r.id, land_class: r.land_class, land_class_label: t.classes[r.land_class],
      crop: r.crop, crop_label: r.crop ? t.crops[r.crop] : null, crop_other: r.crop_other, notes: r.notes,
      area_ha: r.geometry.type === 'Polygon' ? +areaHa(r.geometry).toFixed(4) : null,
      user_name: r.user_name, user_email: r.user_email, institution: r.institution, job_title: r.job_title,
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
