/* =============================================================================
   app.js — TRANSCEND WebGIS
   Mapa (Leaflet), capas, leyenda, mapa base, búsqueda de municipios e idioma.
   Sin servidor: los datos vienen en data/*.js (funciona abriendo index.html o en
   cualquier hosting estático). Mismo patrón de interfaz de la Plataforma AmbGEO.
   ========================================================================== */
(function () {
  'use strict';

  // ------------------------------------------------------------------ idioma
  const LANG_KEY = 'transcend-webgis:lang';
  let lang = (() => {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'es' || q === 'en') return q;
    try { const s = localStorage.getItem(LANG_KEY); if (s === 'es' || s === 'en') return s; } catch (e) { /* */ }
    return 'es';
  })();
  const T = () => window.I18N[lang];
  const nf = (v, d = 0) => new Intl.NumberFormat(lang === 'es' ? 'es-PE' : 'en-GB', { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // ------------------------------------------------------------------ dados
  const DATA = (window.TRANSCEND_DATA = window.TRANSCEND_DATA || {});
  const cache = {};
  function carregarScript(src) {
    return new Promise((ok, erro) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ok; s.onerror = () => erro(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }
  // Formato compacto: coordenadas enteras (×q) en diferencias; se convierte a GeoJSON aquí.
  function decodeLinha(arr, q) {
    const out = []; let x = 0, y = 0;
    for (let i = 0; i < arr.length; i += 2) { x += arr[i]; y += arr[i + 1]; out.push([x / q, y / q]); }
    return out;
  }
  function decodificar(pack) {
    const q = pack.q, props = pack.props;
    const features = pack.rows.map((row) => {
      const p = {}; props.forEach((k, i) => { p[k] = row[i]; });
      const [tipo, c] = row[row.length - 1];
      let geometry;
      if (tipo === 'P') geometry = { type: 'Point', coordinates: [c[0] / q, c[1] / q] };
      else if (tipo === 'L') geometry = c.length === 1 ? { type: 'LineString', coordinates: decodeLinha(c[0], q) }
        : { type: 'MultiLineString', coordinates: c.map((l) => decodeLinha(l, q)) };
      else geometry = c.length === 1 ? { type: 'Polygon', coordinates: c[0].map((r) => decodeLinha(r, q)) }
        : { type: 'MultiPolygon', coordinates: c.map((pol) => pol.map((r) => decodeLinha(r, q))) };
      return { type: 'Feature', properties: p, geometry };
    });
    return { type: 'FeatureCollection', features };
  }
  async function dados(key) {
    if (cache[key]) return cache[key];
    if (!DATA[key]) await carregarScript(`data/${key}.js`);
    cache[key] = decodificar(DATA[key]);
    delete DATA[key];
    return cache[key];
  }

  // ------------------------------------------------------------------ mapa
  const META = window.TRANSCEND_META || {};
  const B = META.bounds || [-71.12, -19.5, -66.36, -14.05];
  const BASIN_BOUNDS = L.latLngBounds([B[1], B[0]], [B[3], B[2]]);
  const map = L.map('map', { zoomControl: false, minZoom: 5, maxZoom: 19, preferCanvas: true, worldCopyJump: false });
  map.fitBounds(BASIN_BOUNDS, { padding: [20, 20] });

  [['raster', 250], ['mun', 400], ['basin', 410], ['roads', 420], ['realce', 430], ['lugares', 610]].forEach(([n, z]) => {
    map.createPane(n); map.getPane(n).style.zIndex = z; map.getPane(n).style.pointerEvents = 'none';
  });
  const R = {};
  ['mun', 'basin', 'roads', 'realce'].forEach((p) => { R[p] = L.canvas({ pane: p, padding: 0.4, tolerance: p === 'roads' ? 4 : 0 }); });

  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
  const ESRI_ATTR = 'Esri, Maxar, Earthstar Geographics';
  const baseLayers = {
    esri: L.tileLayer(`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 19, maxNativeZoom: 18, attribution: ESRI_ATTR }),
    topo: L.tileLayer(`${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 19, maxNativeZoom: 19, attribution: 'Esri' }),
    osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }),
    light: L.tileLayer(`${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 19, maxNativeZoom: 16, attribution: 'Esri, © OpenStreetMap' }),
  };
  const labelsLayer = L.tileLayer(`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`,
    { maxZoom: 19, maxNativeZoom: 17, pane: 'shadowPane', attribution: 'Esri' });
  let currentBase = 'hybrid';
  function setBase(id) {
    currentBase = id;
    Object.values(baseLayers).forEach((l) => map.hasLayer(l) && map.removeLayer(l));
    if (map.hasLayer(labelsLayer)) map.removeLayer(labelsLayer);
    if (id === 'hybrid') { baseLayers.esri.addTo(map); labelsLayer.addTo(map); } else baseLayers[id].addTo(map);
  }
  setBase('hybrid');
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Botão "toda a bacia"
  const CtrlBacia = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const d = L.DomUtil.create('div', 'leaflet-bar ctrl-bacia');
      d.innerHTML = '<a href="#" role="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></a>';
      const a = d.querySelector('a');
      this._a = a;
      L.DomEvent.on(a, 'click', (e) => { L.DomEvent.preventDefault(e); map.fitBounds(BASIN_BOUNDS, { padding: [20, 20] }); });
      L.DomEvent.disableClickPropagation(d);
      return d;
    },
  });
  const ctrlBacia = new CtrlBacia().addTo(map);

  // Selector de mapa base
  const thumb = {
    hybrid: `${ESRI}/World_Imagery/MapServer/tile/7/69/39`, esri: `${ESRI}/World_Imagery/MapServer/tile/7/69/39`,
    topo: `${ESRI}/World_Topo_Map/MapServer/tile/7/69/39`, osm: 'https://tile.openstreetmap.org/7/39/69.png',
    light: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/7/69/39`,
  };
  const CtrlBase = L.Control.extend({
    options: { position: 'topleft' },
    onAdd() {
      const root = L.DomUtil.create('div', 'lc');
      L.DomEvent.disableClickPropagation(root); L.DomEvent.disableScrollPropagation(root);
      this._root = root; this.render();
      document.addEventListener('click', (e) => {
        const p = root.querySelector('.lc-panel');
        if (p && !p.hidden && !root.contains(e.target)) { p.hidden = true; root.querySelector('.lc-toggle').setAttribute('aria-expanded', 'false'); }
      }, true);
      return root;
    },
    render() {
      const t = T();
      const aberto = this._root.querySelector('.lc-panel') && !this._root.querySelector('.lc-panel').hidden;
      this._root.innerHTML = `
        <button type="button" class="lc-toggle" aria-expanded="${aberto}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span>${esc(t.baseMap)}</span></button>
        <div class="lc-panel"${aberto ? '' : ' hidden'}>
          <span class="lc-sub">${esc(t.basemapTitle)}</span>
          <div class="lc-bases">${['hybrid', 'esri', 'topo', 'osm', 'light'].map((id) => `
            <label class="lc-base"><input type="radio" name="lc-base" value="${id}"${currentBase === id ? ' checked' : ''}>
              <img src="${thumb[id]}" alt="" loading="lazy" width="64" height="48">
              ${id === 'hybrid' ? '<span class="lc-base-nomes" aria-hidden="true">Aa</span>' : ''}
              <span>${esc(t.bases[id])}</span></label>`).join('')}
          </div></div>`;
      const btn = this._root.querySelector('.lc-toggle'); const panel = this._root.querySelector('.lc-panel');
      btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
      this._root.querySelectorAll('input[name="lc-base"]').forEach((i) => i.addEventListener('change', () => i.checked && setBase(i.value)));
    },
  });
  const ctrlBase = new CtrlBase().addTo(map);

  // ------------------------------------------------------------------ estilos e popups
  const ROAD = { trunk: ['#ffcc33', 3.4], primary: ['#ffe9a6', 2.3], secondary: ['#ffffff', 1.4] };
  const kv = (pares) => `<dl class="kv">${pares.filter((p) => p[1] !== null && p[1] !== undefined && p[1] !== '').map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const pais = (c) => T().countries[c] || c;

  function popupMun(p) {
    const t = T().pp;
    const tipo = p.country === 'Peru' ? t.district : t.municipality;
    return `<div class="pp-tipo">${esc(tipo)} · ${esc(pais(p.country))}</div><div class="pp-tit">${esc(p.name)}</div>` + kv([
      [p.country === 'Peru' ? t.region : t.department, esc(p.admin1)],
      [t.province, esc(p.admin2)],
      [t.area, `${nf(p.area_km2, 1)} km²`],
      [t.inBasin, `${nf(p.pct_basin, 1)} %`],
    ]);
  }

  // ------------------------------------------------------------------ camadas
  const TRANSP = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const LAYERS = [
    { id: 'basin', sec: 'secLimits', on: true, data: 'basin', dl: 'basin',
      make: (gj) => L.geoJSON(gj, { renderer: R.basin, interactive: false, style: { color: '#ffcc33', weight: 3, fill: false, dashArray: null } }),
      legend: (t) => [['linha', '#ffcc33', t.cls.basinLine]] },
    { id: 'municipalities', sec: 'secLimits', on: true, data: 'municipalities', dl: 'municipalities',
      make: (gj) => L.geoJSON(gj, {
        renderer: R.mun, interactive: false,
        style: { color: '#b57ee0', weight: 1.4, opacity: 0.95, fillColor: '#8a3fc7', fillOpacity: 0.05 },
      }),
      hit: (ll) => hitPoly('municipalities', ll), popup: (f) => popupMun(f.properties),
      legend: (t) => [['area', 'rgba(138,63,199,.12)', t.cls.mun, '#b57ee0']] },
    { id: 'roads', sec: 'secAccess', on: true, data: 'roads', dl: 'roads',
      make: (gj) => {
        const ord = { secondary: 0, primary: 1, trunk: 2 };
        gj.features.sort((a, b) => ord[a.properties.road_class] - ord[b.properties.road_class]);
        const casing = L.geoJSON(gj, { renderer: R.roads, interactive: false,
          style: (f) => ({ color: '#1f1f1f', weight: ROAD[f.properties.road_class][1] + 1.6, opacity: 0.75, lineCap: 'round' }) });
        const core = L.geoJSON(gj, { renderer: R.roads, interactive: false,
          style: (f) => ({ color: ROAD[f.properties.road_class][0], weight: ROAD[f.properties.road_class][1], opacity: 1, lineCap: 'round' }) });
        return L.layerGroup([casing, core]);
      },
      hit: (ll) => hitLine('roads', ll, 7),
      popup: (f) => { const t = T(), p = f.properties;
        return `<div class="pp-tipo">${esc(t.pp.road)}</div><div class="pp-tit">${esc(p.ref || p.name || t.pp.noName)}</div>` +
          kv([[t.pp.roadClass, esc(t.cls[p.road_class])], [t.pp.name, esc(p.name)], [t.pp.ref, esc(p.ref)], [t.pp.surface, esc(p.surface)]]); },
      legend: (t) => [['linha', ROAD.trunk[0], t.cls.trunk, '#1f1f1f'], ['linha', ROAD.primary[0], t.cls.primary, '#1f1f1f'], ['linha', ROAD.secondary[0], t.cls.secondary, '#1f1f1f']] },
    { id: 'places', sec: 'secAccess', on: true, data: 'places', dl: 'places',
      make: (gj) => {
        const g = L.layerGroup();
        gj.features.forEach((f) => {
          const c = f.geometry.coordinates, city = f.properties.place === 'city';
          const m = L.circleMarker([c[1], c[0]], { pane: 'lugares', interactive: false, radius: city ? 5 : 3.6, color: '#1f1f1f', weight: 1.5, fillColor: '#fff', fillOpacity: 1 });
          m.bindTooltip(esc(f.properties.name), { permanent: true, direction: 'right', offset: [5, 0], className: 'rotulo-lugar', pane: 'lugares' });
          m._ehCidade = city;
          g.addLayer(m);
        });
        return g;
      },
      hit: (ll) => hitPoint('places', ll, 9),
      popup: (f) => { const t = T(); return `<div class="pp-tipo">${esc(t.pp[f.properties.place])}</div><div class="pp-tit">${esc(f.properties.name)}</div>`; },
      legend: (t) => [['ponto', '#fff', t.cls.city, '#1f1f1f'], ['ponto', '#fff', t.cls.town, '#1f1f1f']] },
    // Única capa agrícola: el mapa de cultivo del proyecto (compuesto 2022–2024), el que se valida en campo
    { id: 'cropland', sec: 'secAgri', on: true, tiles: 'tiles/cropland/{z}/{x}/{y}.png', opac: 0.85, attr: 'Cropland 2022–2024: TRANSCEND / UoM',
      legend: (t) => [['area', '#ffa500', t.cls.cropland]] },
    // Mapas de cada año (desligados al abrir), para comparar con el compuesto
    ...[['2024', '#00a6ca'], ['2023', '#7570b3'], ['2022', '#d01c8b']].map(([ano, cor]) => ({
      id: `cropland_${ano}`, sec: 'secAgri', on: false, tiles: `tiles/cropland_${ano}/{z}/{x}/{y}.png`, opac: 0.85,
      attr: `Cropland ${ano}: TRANSCEND / UoM`, legend: (t) => [['area', cor, `${t.cls.croplandYear} ${ano}`]] })),
  ];
  const ST = {};   // estado: { on, opac, layer, loading }
  LAYERS.forEach((d) => { ST[d.id] = { on: d.on, opac: d.opac || 1, layer: null }; });

  const loading = document.getElementById('loading');
  let carregando = 0;
  function setLoading(delta) { carregando += delta; loading.hidden = carregando <= 0; }

  async function ligar(id, on) {
    const d = LAYERS.find((x) => x.id === id), s = ST[id];
    s.on = on;
    if (!on) { if (s.layer && map.hasLayer(s.layer)) map.removeLayer(s.layer); syncLabels(); return; }
    if (!s.layer) {
      if (d.tiles) {
        s.layer = L.tileLayer(d.tiles, { pane: 'raster', minNativeZoom: 5, maxNativeZoom: 12, maxZoom: 19, opacity: s.opac,
          bounds: BASIN_BOUNDS.pad(0.05), errorTileUrl: TRANSP, attribution: d.attr || '' });
      } else {
        setLoading(1);
        try { s.layer = d.make(await dados(d.data), s.opac); } finally { setLoading(-1); }
        if (id === 'municipalities') montarRotulosMun();
      }
    }
    if (s.on && !map.hasLayer(s.layer)) s.layer.addTo(map);
    syncLabels();
  }
  function setOpac(id, op) {
    const d = LAYERS.find((x) => x.id === id), s = ST[id];
    s.opac = op;
    if (!s.layer) return;
    if (d.tiles) s.layer.setOpacity(op); else if (d.setOpac) d.setOpac(s.layer, op);
  }

  // Rótulos: lugares (pueblos desde zoom 8) y municipios (desde zoom 9)
  let rotulosMun = null;
  function montarRotulosMun() {
    rotulosMun = L.layerGroup();
    cache.municipalities.features.forEach((f) => {
      const b = L.geoJSON(f).getBounds();
      rotulosMun.addLayer(L.tooltip({ permanent: true, direction: 'center', className: 'rotulo-mun', pane: 'lugares', interactive: false })
        .setLatLng(b.getCenter()).setContent(esc(f.properties.name)));
    });
  }
  function syncLabels() {
    const z = map.getZoom();
    const pl = ST.places.layer;
    if (pl && map.hasLayer(pl)) pl.eachLayer((m) => { const show = m._ehCidade || z >= 8; if (show) m.openTooltip(); else m.closeTooltip(); });
    if (rotulosMun) {
      const want = ST.municipalities.on && z >= 10;
      if (want && !map.hasLayer(rotulosMun)) rotulosMun.addTo(map);
      if (!want && map.hasLayer(rotulosMun)) map.removeLayer(rotulosMun);
    }
  }
  map.on('zoomend', syncLabels);

  // ------------------------------------------------------------------ painel de camadas
  const ICON_ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M11 8v6M8 11h6" stroke-linecap="round"/></svg>';
  const ICON_DL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const secFechadas = new Set();
  function swatch([tipo, cor, , borda]) {
    if (tipo === 'linha') return `<span class="sw linha" style="border-top-color:${cor};box-shadow:0 0 0 1px ${borda || 'transparent'}"></span>`;
    if (tipo === 'ponto') return `<span class="sw ponto" style="background:${cor};border:1.5px solid ${borda}"></span>`;
    return `<span class="sw" style="background:${cor};border-color:${borda || 'rgba(0,0,0,.18)'}"></span>`;
  }
  function renderLegenda() {
    const t = T();
    const body = document.getElementById('legend-body');
    const secs = [...new Set(LAYERS.map((d) => d.sec))];
    body.innerHTML = secs.map((sec) => `
      <div class="legend-sec${secFechadas.has(sec) ? ' is-collapsed' : ''}" data-sec="${sec}">
        <button type="button" class="legend-sec-title">${esc(t[sec])}</button>
        <div class="legend-sec-body">${LAYERS.filter((d) => d.sec === sec).map((d) => {
          const [nome, fonte] = t.lyr[d.id]; const s = ST[d.id];
          return `<div class="legend-layer${s.on ? '' : ' is-off'}" data-id="${d.id}">
            <div class="legend-layer-name">
              <input type="checkbox" id="chk-${d.id}"${s.on ? ' checked' : ''}>
              <label class="legend-nome" for="chk-${d.id}">${esc(nome)}<span class="legend-fonte">${esc(fonte)}</span></label>
              <span class="legend-acoes">
                ${d.data ? `<button type="button" class="ic-btn" data-zoom="${d.id}" title="${esc(t.zoomTo)}" aria-label="${esc(t.zoomTo)}">${ICON_ZOOM}</button>` : ''}
                ${d.dl ? `<a class="ic-btn" href="data/download/${d.dl}.geojson" download title="${esc(t.download)}" aria-label="${esc(t.download)}">${ICON_DL}</a>` : ''}
              </span>
            </div>
            <ul class="legend-classes">${d.legend(t).map((c) => `<li class="legend-class">${swatch(c)}<span>${esc(c[2])}</span></li>`).join('')}</ul>
            ${d.opac ? `<label class="legend-opac">${esc(t.opacity)}<input type="range" min="0.1" max="1" step="0.05" value="${s.opac}" data-opac="${d.id}"></label>` : ''}
          </div>`;
        }).join('')}</div>
      </div>`).join('');
  }
  document.getElementById('legend-body').addEventListener('change', (e) => {
    const chk = e.target.closest('input[type=checkbox]');
    if (chk) { const id = chk.id.slice(4); chk.closest('.legend-layer').classList.toggle('is-off', !chk.checked); ligar(id, chk.checked); }
  });
  document.getElementById('legend-body').addEventListener('input', (e) => {
    if (e.target.dataset.opac) setOpac(e.target.dataset.opac, parseFloat(e.target.value));
  });
  document.getElementById('legend-body').addEventListener('click', async (e) => {
    const sec = e.target.closest('.legend-sec-title');
    if (sec) { const el = sec.parentElement; el.classList.toggle('is-collapsed'); el.classList.contains('is-collapsed') ? secFechadas.add(el.dataset.sec) : secFechadas.delete(el.dataset.sec); return; }
    const z = e.target.closest('[data-zoom]');
    if (z) {
      const id = z.dataset.zoom;
      if (!ST[id].on) { document.getElementById('chk-' + id).checked = true; document.querySelector(`.legend-layer[data-id="${id}"]`).classList.remove('is-off'); }
      await ligar(id, true);
      const lyr = ST[id].layer;
      const b = lyr.getBounds ? lyr.getBounds() : L.featureGroup(lyr.getLayers()).getBounds();
      if (b.isValid()) map.fitBounds(b, { padding: [20, 20] });
    }
  });
  document.getElementById('btn-legend-recolher').addEventListener('click', () => {
    const secs = [...document.querySelectorAll('.legend-sec')];
    const fechar = secs.some((s) => !s.classList.contains('is-collapsed'));
    secs.forEach((s) => { s.classList.toggle('is-collapsed', fechar); fechar ? secFechadas.add(s.dataset.sec) : secFechadas.delete(s.dataset.sec); });
  });


  // ------------------------------------------------------------------ consulta por clique
  // Las capas se dibujan en canvas sin eventos (más rápido); el clic se resuelve aquí, de la capa de arriba a la de abajo.
  const BBOX = {};
  function bboxes(key) {
    if (BBOX[key]) return BBOX[key];
    return (BBOX[key] = cache[key].features.map((f) => {
      let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
      const walk = (c) => { if (typeof c[0] === 'number') { if (c[0] < x0) x0 = c[0]; if (c[0] > x1) x1 = c[0]; if (c[1] < y0) y0 = c[1]; if (c[1] > y1) y1 = c[1]; } else c.forEach(walk); };
      walk(f.geometry.coordinates); return [x0, y0, x1, y1];
    }));
  }
  function noAnel(x, y, r) {
    let d = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d;
    }
    return d;
  }
  function noPoligono(x, y, pol) { if (!noAnel(x, y, pol[0])) return false; for (let k = 1; k < pol.length; k++) if (noAnel(x, y, pol[k])) return false; return true; }
  function hitPoly(key, ll) {
    if (!cache[key]) return null;
    const x = ll.lng, y = ll.lat, bb = bboxes(key), fs = cache[key].features;
    for (let i = fs.length - 1; i >= 0; i--) {
      const b = bb[i]; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
      const g = fs[i].geometry;
      const pols = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      if (pols.some((p) => noPoligono(x, y, p))) return fs[i];
    }
    return null;
  }
  function distSeg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
    let t = l ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l : 0; t = Math.max(0, Math.min(1, t));
    const qx = a.x + t * dx - p.x, qy = a.y + t * dy - p.y; return Math.sqrt(qx * qx + qy * qy);
  }
  function hitLine(key, ll, tolPx) {
    if (!cache[key]) return null;
    const p = map.latLngToLayerPoint(ll);
    const d = map.layerPointToLatLng(L.point(p.x + tolPx, p.y)).lng - ll.lng;
    const bb = bboxes(key), fs = cache[key].features;
    let best = null, bestD = tolPx;
    for (let i = 0; i < fs.length; i++) {
      const b = bb[i]; if (ll.lng < b[0] - d || ll.lng > b[2] + d || ll.lat < b[1] - d || ll.lat > b[3] + d) continue;
      const g = fs[i].geometry, linhas = g.type === 'LineString' ? [g.coordinates] : g.coordinates;
      linhas.forEach((ln) => {
        for (let k = 1; k < ln.length; k++) {
          const dd = distSeg(p, map.latLngToLayerPoint([ln[k - 1][1], ln[k - 1][0]]), map.latLngToLayerPoint([ln[k][1], ln[k][0]]));
          if (dd < bestD) { bestD = dd; best = fs[i]; }
        }
      });
    }
    return best;
  }
  function hitPoint(key, ll, tolPx) {
    if (!cache[key]) return null;
    const p = map.latLngToLayerPoint(ll); let best = null, bestD = tolPx;
    cache[key].features.forEach((f) => {
      const c = f.geometry.coordinates, q = map.latLngToLayerPoint([c[1], c[0]]), dd = p.distanceTo(q);
      if (dd < bestD) { bestD = dd; best = f; }
    });
    return best;
  }
  const ORDEM_CLIQUE = ['places', 'roads', 'municipalities'];
  map.on('click', (e) => {
    if (map._bloquearConsulta) return;   // dibujando una validación (js/validacao.js)
    for (const id of ORDEM_CLIQUE) {
      const d = LAYERS.find((x) => x.id === id), s = ST[id];
      if (!s.on || !s.layer || !d.hit) continue;
      if (id === 'places' && map.getZoom() < 7) continue;
      const f = d.hit(e.latlng);
      if (f) { abrirPopup(e.latlng, d.popup(f)); return; }
    }
  });

  // ------------------------------------------------------------------ popup
  let popup = null;
  function abrirPopup(latlng, html) {
    popup = L.popup({ maxWidth: 320, autoPanPadding: [40, 40] }).setLatLng(latlng).setContent(html).openOn(map);
  }

  // ------------------------------------------------------------------ explorar
  const input = document.getElementById('busca-mun'), lista = document.getElementById('busca-lista');
  let filtroPais = 'all', selecionado = null, realce = null, ativo = -1;
  function candidatos() {
    const fc = cache.municipalities; if (!fc) return [];
    const q = semAcento(input.value.trim());
    return fc.features.filter((f) => (filtroPais === 'all' || f.properties.country === filtroPais) &&
      (!q || semAcento(f.properties.name).includes(q) || semAcento(f.properties.admin2).includes(q)))
      .sort((a, b) => a.properties.name.localeCompare(b.properties.name)).slice(0, 60);
  }
  function renderLista() {
    const t = T(); const c = candidatos(); ativo = -1;
    if (!input.value.trim() && document.activeElement !== input) { lista.hidden = true; return; }
    lista.innerHTML = c.length ? c.map((f, i) => `<li role="option" data-i="${i}">${esc(f.properties.name)}<small>${esc(f.properties.admin2)}, ${esc(f.properties.admin1)} · ${esc(pais(f.properties.country))}</small></li>`).join('')
      : `<li class="vazio">${esc(t.noResults)}</li>`;
    lista._c = c; lista.hidden = false;
  }
  input.addEventListener('input', renderLista);
  input.addEventListener('focus', renderLista);
  input.addEventListener('keydown', (e) => {
    const items = [...lista.querySelectorAll('li[data-i]')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!items.length) return;
      ativo = (ativo + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('is-ativo', i === ativo)); items[ativo].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { e.preventDefault(); const i = ativo >= 0 ? ativo : 0; if (lista._c && lista._c[i]) escolher(lista._c[i]); }
    else if (e.key === 'Escape') lista.hidden = true;
  });
  lista.addEventListener('mousedown', (e) => { const li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); escolher(lista._c[+li.dataset.i]); } });
  input.addEventListener('blur', () => setTimeout(() => { lista.hidden = true; }, 120));
  document.querySelectorAll('.chip[data-pais]').forEach((b) => b.addEventListener('click', () => {
    filtroPais = b.dataset.pais;
    document.querySelectorAll('.chip[data-pais]').forEach((x) => x.classList.toggle('is-on', x === b));
    renderResumo(); if (input.value.trim()) renderLista();
  }));
  function escolher(f) {
    selecionado = f; input.value = f.properties.name; lista.hidden = true;
    if (realce) map.removeLayer(realce);
    realce = L.geoJSON(f, { renderer: R.realce, interactive: false, style: { color: '#ffcc33', weight: 4, fill: false } }).addTo(map);
    map.fitBounds(realce.getBounds(), { padding: [40, 40], maxZoom: 12 });
    renderFicha();
  }
  function renderFicha() {
    const el = document.getElementById('ficha');
    if (!selecionado) { el.hidden = true; return; }
    const p = selecionado.properties, t = T().pp;
    el.innerHTML = `<h3>${esc(p.name)}</h3><p class="ficha-sub">${esc(p.country === 'Peru' ? t.district : t.municipality)} · ${esc(pais(p.country))}</p>` + kv([
      [p.country === 'Peru' ? t.region : t.department, esc(p.admin1)], [t.province, esc(p.admin2)], [t.code, esc(p.code)],
      [t.area, `${nf(p.area_km2, 1)} km²`], [t.inBasin, `${nf(p.pct_basin, 1)} %`]]);
    el.hidden = false;
  }
  function renderResumo() {
    const t = T(), m = META;
    const soma = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
    const nMun = filtroPais === 'all' ? soma(m.mun) : (m.mun || {})[filtroPais] || 0;
    document.getElementById('resumo').innerHTML = `<h4>${esc(t.summary)}</h4><div class="cards">
      <div class="card"><b>${nf(nMun)}</b><span>${esc(t.cards.mun)}</span></div>
      <div class="card"><b>${nf(m.places || 0)}</b><span>${esc(t.cards.places)}</span></div>
      <div class="card"><b>${nf(m.basin_km2 || 0)}</b><span>${esc(t.cards.basinArea)}</span></div>
      <div class="card"><b>${nf(soma(m.roads_km))}</b><span>${esc(t.cards.roads)}</span></div></div>`;
  }
  document.getElementById('btn-bacia').addEventListener('click', () => map.fitBounds(BASIN_BOUNDS, { padding: [20, 20] }));

  // ------------------------------------------------------------------ abas e menu
  document.querySelectorAll('.side-icon').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.side-icon').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    document.querySelectorAll('[data-painel]').forEach((p) => { p.hidden = p.dataset.painel !== b.dataset.side; });
  }));
  const sidebar = document.getElementById('sidebar'), toggle = document.getElementById('btn-sidebar-toggle');
  const mobile = () => window.matchMedia('(max-width: 860px)').matches;
  function syncToggle() {
    const fechado = sidebar.classList.contains('is-collapsed');
    toggle.setAttribute('aria-expanded', String(!fechado));
    toggle.title = fechado ? T().menuOpen : T().menuClose;
    toggle.querySelector('.sidebar-toggle-icon').textContent = mobile() ? (fechado ? '▴' : '▾') : (fechado ? '›' : '‹');
  }
  if (mobile()) sidebar.classList.add('is-collapsed');
  toggle.addEventListener('click', () => { sidebar.classList.toggle('is-collapsed'); syncToggle(); setTimeout(() => map.invalidateSize(), 250); });
  window.addEventListener('resize', syncToggle);

  // coordenadas
  const coords = document.getElementById('coords');
  map.on('mousemove', (e) => { coords.textContent = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`; });
  map.on('mouseout', () => { coords.textContent = ''; });

  // ------------------------------------------------------------------ idioma
  function aplicarIdioma(novo) {
    lang = novo;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* */ }
    const t = T();
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { const v = t[el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t[el.dataset.i18nTitle]; });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t[el.dataset.i18nAria]); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t[el.dataset.i18nPh]; });
    document.querySelectorAll('.idioma-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    document.querySelectorAll('.chip[data-pais]').forEach((b) => { if (b.dataset.pais !== 'all') b.textContent = t.countries[b.dataset.pais]; });
    document.getElementById('sobre-corpo').innerHTML = t.about;
    ctrlBacia._a.title = t.zoomBasin; ctrlBacia._a.setAttribute('aria-label', t.zoomBasin);
    renderLegenda(); renderResumo(); renderFicha(); ctrlBase.render(); syncToggle();
    if (popup && map.hasLayer(popup)) map.closePopup();
    const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
    document.dispatchEvent(new CustomEvent('transcend:lang', { detail: lang }));
  }
  document.querySelectorAll('.idioma-btn').forEach((b) => b.addEventListener('click', () => aplicarIdioma(b.dataset.lang)));

  // ------------------------------------------------------------------ início
  aplicarIdioma(lang);
  Promise.all(LAYERS.filter((d) => ST[d.id].on).map((d) => ligar(d.id, true).catch((e) => console.error(e))))
    .finally(() => {
      document.getElementById('carregando-app').hidden = true;
      document.dispatchEvent(new CustomEvent('transcend:pronto'));
    });
  window.TRANSCEND_MAP = map;
  // Para los módulos que se cargan después (js/validacao.js)
  window.TRANSCEND_APP = { map, T, esc, nf, kv, lang: () => lang };
}());
