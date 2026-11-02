/* =============================================================================
   i18n.js — textos en español (por defecto) e inglés.
   El idioma se elige con los botones ES/EN, con ?lang=en en la dirección o queda
   el último usado en este navegador.
   ========================================================================== */
window.I18N = {
  es: {
    loadingApp: 'Cargando el WebGIS…',
    loadingLayer: 'Cargando capa…',
    langGroup: 'Idioma',
    themeToggle: 'Cambiar entre tema claro y oscuro',
    subtitle: 'Cuenca del lago Titicaca · Perú y Bolivia',
    tabsLabel: 'Paneles',
    tabLayers: 'Capas', tabExplore: 'Explorar', tabAbout: 'Acerca de',
    layersTitle: 'Capas del mapa',
    collapseAll: 'Recoger o abrir todas las secciones',
    menu: 'Menú', menuClose: 'Recoger menú', menuOpen: 'Abrir menú',
    footer: 'Proyecto TRANSCEND · The University of Manchester',
    searchLabel: 'Buscar municipio o distrito',
    searchPh: 'Escriba un nombre…',
    noResults: 'Sin resultados',
    countryFilter: 'País', all: 'Todos',
    zoomBasin: 'Ver toda la cuenca',
    zoomTo: 'Acercar a la capa', download: 'Descargar GeoJSON', opacity: 'Opacidad',
    baseMap: 'Mapa base', basemapTitle: 'Mapa base',
    bases: { hybrid: 'Satélite con nombres', esri: 'Satélite', topo: 'Relieve', osm: 'Calles', light: 'Claro' },
    secLimits: 'Límites', secAccess: 'Accesos', secAgri: 'Agricultura',
    lyr: {
      basin: ['Cuenca de estudio', 'Titicaca – Desaguadero – Mauri – Caplina'],
      municipalities: ['Municipios y distritos en la cuenca', 'Bolivia: municipios 2024 · Perú: distritos'],
      roads: ['Carreteras principales', '© OpenStreetMap, nov. 2026'],
      places: ['Ciudades y pueblos', '© OpenStreetMap'],
      agri_peru: ['Áreas agrícolas UoM – Perú', 'Pre-survey UoM 2026 (Living Lab, MINAGRI)'],
      agri_bolivia: ['Áreas agrícolas clasificadas UoM – Bolivia', 'Pre-survey UoM 2026 · mezcla de cultivos (%)'],
      tdps: ['Área agrícola total de la cuenca', 'Pre-survey UoM 2026 · Perú y Bolivia'],
      cropland: ['Tierras de cultivo 2024', 'Clasificación UoM · Perú y Bolivia'],
    },
    cls: {
      mun: 'Municipio (Bolivia) / distrito (Perú)', basinLine: 'Límite de la cuenca',
      trunk: 'Carretera troncal nacional', primary: 'Carretera primaria', secondary: 'Carretera secundaria',
      city: 'Ciudad', town: 'Pueblo', agriPe: 'Área agrícola', tdps: 'Área agrícola', cropland: 'Cultivo 2024',
      Forraje1: 'Forraje 1 – alfalfa 30, cebada 25, avena 20, quinua 15, papa 10',
      Forraje2: 'Forraje 2 – alfalfa 30, quinua 30, papa 20, cañahua 10, cebada 10',
      Hortalizas: 'Hortalizas – cebolla 25, zanahoria 25, haba 20, papa 20, alfalfa 10',
      Papa: 'Papa – papa 30, cebada 30, haba 20, quinua 10, avena 10',
      Quinuas1: 'Quinua 1 – quinua 75, papa 10, cebada 10, cañahua 5',
      Quinuas2: 'Quinua 2 – quinua 30, papa 25, alfalfa 20, cañahua 15, cebada 10',
    },
    clsShort: { Forraje1: 'Forraje 1', Forraje2: 'Forraje 2', Hortalizas: 'Hortalizas', Papa: 'Papa', Quinuas1: 'Quinua 1', Quinuas2: 'Quinua 2' },
    pp: {
      municipality: 'Municipio', district: 'Distrito', agri: 'Área agrícola', road: 'Carretera', place: 'Localidad',
      country: 'País', department: 'Departamento', region: 'Región', province: 'Provincia', area: 'Superficie',
      inBasin: 'En la cuenca', study: 'Área de estudio', yes: 'Sí', no: 'No', class: 'Clase', mix: 'Mezcla de cultivos (%)',
      subbasin: 'Subcuenca', soil: 'Suelo (USDA)', ref: 'Ruta', name: 'Nombre', roadClass: 'Tipo', surface: 'Superficie de rodadura',
      town: 'Pueblo', city: 'Ciudad', code: 'Código', noName: 'Sin nombre',
    },
    countries: { Peru: 'Perú', Bolivia: 'Bolivia' },
    summary: 'Resumen de la cuenca',
    cards: { mun: 'municipios / distritos', places: 'ciudades y pueblos', basinArea: 'km² de cuenca', roads: 'km de carreteras principales' },
    about: `
      <h3>TRANSCEND · WebGIS</h3>
      <p>Visor de las bases usadas en el trabajo de campo del proyecto TRANSCEND en la cuenca del lago Titicaca (Perú y Bolivia).
      Haga clic en el mapa para ver los datos de cada elemento. Las capas se encienden y apagan en la pestaña <b>Capas</b>;
      la pestaña <b>Explorar</b> busca municipios y distritos.</p>
      <h4>Fuentes</h4>
      <ul>
        <li><b>Cuenca</b>: Titicaca – Desaguadero – Mauri – Caplina (HydroBASINS).</li>
        <li><b>Municipios y distritos</b>: Bolivia, municipios 2024; Perú, distritos (límites adm3, per_admin_boundaries). Se muestran los que tienen al menos 1 % de su superficie en la cuenca.</li>
        <li><b>Carreteras y localidades</b>: © colaboradores de OpenStreetMap (ODbL), extraídos el 2 nov. 2026.</li>
        <li><b>Áreas agrícolas UoM – Perú</b>: pre-survey UoM 2026, capa Living Lab (MINAGRI, interpretación de Sentinel-2 2017–2018 y RapidEye 2012).</li>
        <li><b>Áreas agrícolas clasificadas – Bolivia</b>: pre-survey UoM 2026, mezclas de cultivos por clase (%).</li>
        <li><b>Área agrícola total de la cuenca</b>: pre-survey UoM 2026 (TDPS).</li>
        <li><b>Tierras de cultivo 2024</b>: clasificación UoM, 30 m.</li>
        <li><b>Mapas base</b>: Esri, Maxar, Earthstar Geographics; © OpenStreetMap.</li>
      </ul>
      <h4>Notas</h4>
      <ul>
        <li>Las geometrías se simplificaron para la web (tolerancia ≈ 10 m; se omiten piezas menores de 0,1 ha). Use los archivos originales para cálculos.</li>
        <li>Las dos capas de cultivo de la cuenca se muestran como imagen (teselas) hasta el zoom 12.</li>
        <li>Las superficies se calcularon en WGS 84 / UTM 19S.</li>
      </ul>
      <p class="nota">Proyecto TRANSCEND · The University of Manchester · noviembre 2026</p>`,
  },
  en: {
    loadingApp: 'Loading the WebGIS…',
    loadingLayer: 'Loading layer…',
    langGroup: 'Language',
    themeToggle: 'Switch between light and dark theme',
    subtitle: 'Lake Titicaca basin · Peru and Bolivia',
    tabsLabel: 'Panels',
    tabLayers: 'Layers', tabExplore: 'Explore', tabAbout: 'About',
    layersTitle: 'Map layers',
    collapseAll: 'Collapse or expand all sections',
    menu: 'Menu', menuClose: 'Collapse menu', menuOpen: 'Open menu',
    footer: 'TRANSCEND project · The University of Manchester',
    searchLabel: 'Search municipality or district',
    searchPh: 'Type a name…',
    noResults: 'No results',
    countryFilter: 'Country', all: 'All',
    zoomBasin: 'Show the whole basin',
    zoomTo: 'Zoom to layer', download: 'Download GeoJSON', opacity: 'Opacity',
    baseMap: 'Base map', basemapTitle: 'Base map',
    bases: { hybrid: 'Satellite with labels', esri: 'Satellite', topo: 'Terrain', osm: 'Streets', light: 'Light' },
    secLimits: 'Boundaries', secAccess: 'Access', secAgri: 'Agriculture',
    lyr: {
      basin: ['Study basin', 'Titicaca – Desaguadero – Mauri – Caplina'],
      municipalities: ['Municipalities and districts in the basin', 'Bolivia: municipalities 2024 · Peru: districts'],
      roads: ['Main roads', '© OpenStreetMap, Nov 2026'],
      places: ['Cities and towns', '© OpenStreetMap'],
      agri_peru: ['UoM agricultural areas – Peru', 'UoM 2026 pre-survey (Living Lab, MINAGRI)'],
      agri_bolivia: ['UoM classified agricultural areas – Bolivia', 'UoM 2026 pre-survey · crop mix (%)'],
      tdps: ['Total agricultural area of the basin', 'UoM 2026 pre-survey · Peru and Bolivia'],
      cropland: ['Cropland 2024', 'UoM classification · Peru and Bolivia'],
    },
    cls: {
      mun: 'Municipality (Bolivia) / district (Peru)', basinLine: 'Basin boundary',
      trunk: 'National trunk road', primary: 'Primary road', secondary: 'Secondary road',
      city: 'City', town: 'Town', agriPe: 'Agricultural area', tdps: 'Agricultural area', cropland: 'Cropland 2024',
      Forraje1: 'Forage 1 – alfalfa 30, barley 25, oats 20, quinoa 15, potato 10',
      Forraje2: 'Forage 2 – alfalfa 30, quinoa 30, potato 20, cañahua 10, barley 10',
      Hortalizas: 'Vegetables – onion 25, carrot 25, broad bean 20, potato 20, alfalfa 10',
      Papa: 'Potato – potato 30, barley 30, broad bean 20, quinoa 10, oats 10',
      Quinuas1: 'Quinoa 1 – quinoa 75, potato 10, barley 10, cañahua 5',
      Quinuas2: 'Quinoa 2 – quinoa 30, potato 25, alfalfa 20, cañahua 15, barley 10',
    },
    clsShort: { Forraje1: 'Forage 1', Forraje2: 'Forage 2', Hortalizas: 'Vegetables', Papa: 'Potato', Quinuas1: 'Quinoa 1', Quinuas2: 'Quinoa 2' },
    pp: {
      municipality: 'Municipality', district: 'District', agri: 'Agricultural area', road: 'Road', place: 'Settlement',
      country: 'Country', department: 'Department', region: 'Region', province: 'Province', area: 'Area',
      inBasin: 'In the basin', study: 'Study area', yes: 'Yes', no: 'No', class: 'Class', mix: 'Crop mix (%)',
      subbasin: 'Sub-basin', soil: 'Soil (USDA)', ref: 'Route', name: 'Name', roadClass: 'Type', surface: 'Surface',
      town: 'Town', city: 'City', code: 'Code', noName: 'Unnamed',
    },
    countries: { Peru: 'Peru', Bolivia: 'Bolivia' },
    summary: 'Basin summary',
    cards: { mun: 'municipalities / districts', places: 'cities and towns', basinArea: 'km² of basin', roads: 'km of main roads' },
    about: `
      <h3>TRANSCEND · WebGIS</h3>
      <p>Viewer of the datasets used for the TRANSCEND fieldwork in the Lake Titicaca basin (Peru and Bolivia).
      Click on the map to see the data of each feature. Turn layers on and off in the <b>Layers</b> tab;
      the <b>Explore</b> tab searches municipalities and districts.</p>
      <h4>Sources</h4>
      <ul>
        <li><b>Basin</b>: Titicaca – Desaguadero – Mauri – Caplina (HydroBASINS).</li>
        <li><b>Municipalities and districts</b>: Bolivia, municipalities 2024; Peru, districts (adm3 boundaries, per_admin_boundaries). Those with at least 1% of their area in the basin are shown.</li>
        <li><b>Roads and settlements</b>: © OpenStreetMap contributors (ODbL), extracted 2 Nov 2026.</li>
        <li><b>UoM agricultural areas – Peru</b>: UoM 2026 pre-survey, Living Lab layer (MINAGRI, interpreted from Sentinel-2 2017–2018 and RapidEye 2012).</li>
        <li><b>Classified agricultural areas – Bolivia</b>: UoM 2026 pre-survey, crop mixes per class (%).</li>
        <li><b>Total agricultural area of the basin</b>: UoM 2026 pre-survey (TDPS).</li>
        <li><b>Cropland 2024</b>: UoM classification, 30 m.</li>
        <li><b>Base maps</b>: Esri, Maxar, Earthstar Geographics; © OpenStreetMap.</li>
      </ul>
      <h4>Notes</h4>
      <ul>
        <li>Geometries were simplified for the web (≈ 10 m tolerance; parts smaller than 0.1 ha omitted). Use the original files for calculations.</li>
        <li>The two basin-wide crop layers are shown as images (tiles) up to zoom 12.</li>
        <li>Areas were computed in WGS 84 / UTM 19S.</li>
      </ul>
      <p class="nota">TRANSCEND project · The University of Manchester · November 2026</p>`,
  },
};
