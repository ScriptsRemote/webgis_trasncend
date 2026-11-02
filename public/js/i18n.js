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
    helpOpen: 'Guía de uso',
    tut: {
      stepOf: 'Paso {n} de {t}', pages: 'Páginas de la guía',
      next: 'Siguiente', back: 'Anterior', skip: 'Saltar', done: 'Empezar', close: 'Cerrar',
      steps: [
        { t: 'Bienvenido al TRANSCEND WebGIS', alt: 'Vista general del WebGIS con el mapa de la cuenca',
          d: 'Visor de la cuenca del lago Titicaca (Perú y Bolivia) con las capas del trabajo de campo. En 6 pasos verá cómo <b>explorar el mapa</b> y cómo <b>registrar validaciones</b> de la cobertura del suelo. Puede volver a esta guía cuando quiera con el botón <b>?</b> de arriba.' },
        { t: 'Capas y mapa base', alt: 'Panel de capas y selector de mapa base',
          d: 'En la pestaña <b>Capas</b> encienda o apague cada capa, ajuste la opacidad, acerque a la capa (lupa) o descárguela en GeoJSON (flecha). El botón <b>Mapa base</b>, arriba a la izquierda del mapa, cambia el fondo: satélite, relieve, calles o claro.' },
        { t: 'Explorar y consultar', alt: 'Búsqueda de un distrito y ficha con sus datos',
          d: 'En <b>Explorar</b> escriba el nombre de un municipio o distrito y elíjalo en la lista: el mapa se acerca y aparece su ficha. Haga <b>clic en cualquier elemento del mapa</b> (área agrícola, carretera, municipio) para ver sus datos.' },
        { t: 'Regístrese para validar', alt: 'Formulario de registro con nombre, correo, institución y cargo',
          d: 'En la pestaña <b>Validar</b>, regístrese <b>una sola vez</b> con nombre, correo, institución y cargo, y acepte el uso de sus datos. Sus datos solo los ve el responsable del proyecto; en el mapa cada persona ve solo sus propias validaciones.' },
        { t: 'Marque un punto o dibuje un polígono', alt: 'Formulario de validación con clase y tipo de cultivo',
          d: 'Use <b>Marcar punto</b> o <b>Dibujar polígono</b> (también en los botones a la derecha del mapa). En el polígono, haga clic en cada vértice y cierre en el primero o con <b>Terminar</b>. Elija la <b>clase</b> y, si es agricultura, el <b>tipo de cultivo</b>; pulse <b>Guardar</b>.' },
        { t: 'Revise y envíe', alt: 'Panel con borradores y el botón Enviar validaciones',
          d: 'Lo guardado queda como <b>borrador</b> en su aparato (contorno punteado): haga clic en él para <b>editarlo o eliminarlo</b>. Cuando esté listo, pulse <b>Enviar validaciones</b>. Sin internet, se envían solas cuando vuelve la conexión. ¡Listo para empezar!' },
      ],
    },
    subtitle: 'Cuenca del lago Titicaca · Perú y Bolivia',
    tabsLabel: 'Paneles',
    tabLayers: 'Capas', tabExplore: 'Explorar', tabValidate: 'Validar', tabAbout: 'Acerca de',
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
      agri_peru: ['Áreas agrícolas – Perú', 'Living Lab (MINAGRI) · pre-survey 2026'],
      agri_bolivia: ['Áreas agrícolas clasificadas – Bolivia', 'Pre-survey 2026 · mezcla de cultivos (%)'],
      tdps: ['Área agrícola total de la cuenca', 'TDPS · pre-survey 2026 · Perú y Bolivia'],
      cropland: ['Tierras de cultivo 2024', 'TRANSCEND (UoM) · HLS + Random Forest, 30 m'],
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
    val: {
      title: 'Validación en campo',
      intro: 'Marque un punto o dibuje un polígono sobre el mapa e indique la cobertura observada. «Guardar» crea un borrador en este aparato; revise y pulse «Enviar» para mandar sus validaciones. En el mapa solo se ven sus propias validaciones.',
      needUser: 'Antes de validar, regístrese con su nombre, correo, institución y cargo.',
      register: 'Registrarse', change: 'Cambiar',
      point: 'Punto', polygon: 'Polígono',
      drawPoint: 'Marcar punto', drawPolygon: 'Dibujar polígono',
      ctrlPoint: 'Validar con un punto', ctrlPolygon: 'Validar con un polígono',
      hintPoint: 'Haga clic en el mapa para ubicar el punto.',
      hintPolygon: 'Haga clic para agregar vértices; clic en el primero o en «Terminar» para cerrar.',
      undo: 'Deshacer vértice', finish: 'Terminar', cancel: 'Cancelar', save: 'Guardar',
      userTitle: 'Registro de usuario',
      userIntro: 'Estos datos acompañan cada validación que usted registre.',
      name: 'Nombre y apellido', email: 'Correo electrónico', institution: 'Institución', role: 'Cargo',
      privacy: 'Sus datos personales (nombre, correo, institución y cargo) se guardan junto con sus validaciones en una base protegida, con acceso solo del responsable del proyecto TRANSCEND (The University of Manchester). Se usan únicamente para identificar el origen de cada registro y no se publican ni se comparten. Puede pedir en cualquier momento la corrección o eliminación de sus datos al equipo del proyecto.',
      consent: 'Leí la información anterior y acepto el uso de mis datos para este fin.',
      saveUser: 'Guardar y continuar',
      newTitle: 'Nueva validación', editTitle: 'Editar validación',
      classLabel: 'Clase', cropLabel: 'Tipo de cultivo', cropOther: 'Especifique el cultivo',
      notes: 'Observaciones', notesPh: 'Opcional: estado del cultivo, tipo de riego, fecha de siembra…',
      choose: 'Seleccione…',
      classes: {
        agri_irrigada: 'Agricultura irrigada', agri_secano: 'Agricultura no irrigada (secano)',
        veg_natural: 'Vegetación natural', pastizal: 'Pastizal / pastos', humedal: 'Humedal / bofedal', suelo_roca: 'Suelo desnudo / roca',
      },
      crops: {
        papa: 'Papa', papa_amarga: 'Papa amarga (luki)', quinua: 'Quinua', canahua: 'Cañahua', cebada_grano: 'Cebada (grano)',
        cebada_forrajera: 'Cebada forrajera', avena_forrajera: 'Avena forrajera', alfalfa: 'Alfalfa',
        pasto_cultivado: 'Pasto cultivado (falaris, ryegrass, dactylis)', haba: 'Haba', arveja: 'Arveja', oca: 'Oca',
        olluco: 'Olluco / papalisa', isano: 'Isaño', tarwi: 'Tarwi', trigo: 'Trigo', maiz: 'Maíz',
        hortalizas: 'Hortalizas (cebolla, zanahoria, lechuga…)', descanso: 'En descanso / barbecho',
        no_ident: 'Cultivo no identificado', otro: 'Otro (especifique)',
      },
      mine: 'Mis validaciones', none: 'Aún no registró validaciones.', legend: 'Clases',
      download: 'Descargar mis validaciones (GeoJSON)',
      edit: 'Editar', del: 'Eliminar', zoom: 'Ver en el mapa', myValidation: 'Mi validación',
      confirmDelete: '¿Eliminar esta validación?',
      deleteFail: 'No se pudo eliminar en el servidor. Verifique la conexión e intente de nuevo.',
      created: 'Fecha', status: 'Estado', area: 'Superficie',
      st: { draft: 'Borrador (sin enviar)', sent: 'Enviada', pending: 'Pendiente de envío', rejected: 'Rechazada: revise y edite', local: 'Solo en este navegador' },
      draftsN: 'Tiene {n} validación(es) en borrador, guardada(s) solo en este aparato. Revíselas y envíelas.',
      sendDrafts: 'Enviar validaciones ({n})',
      localOnly: 'El WebGIS se abrió sin servidor (archivo local): las validaciones se guardan solo en este navegador. Descárguelas en GeoJSON.',
      rejectedN: 'El servidor rechazó {n} validación(es) por datos inválidos. Ábralas en el mapa, revíselas y guárdelas de nuevo.',
      tooMany: 'Demasiados envíos seguidos; se reintentará en unos minutos.',
      sending: 'Enviando validaciones…',
      pendingN: 'Pendientes de envío: {n}. Se envían solas cuando hay internet.',
      sendError: 'Último intento: {e}',
      sendNow: 'Enviar ahora',
      allSent: 'Todas sus validaciones fueron enviadas.',
    },
    about: `
      <h3>TRANSCEND · WebGIS</h3>
      <p>Visor de las bases usadas en el trabajo de campo del proyecto TRANSCEND en la cuenca del lago Titicaca (Perú y Bolivia).
      Haga clic en el mapa para ver los datos de cada elemento. Las capas se encienden y apagan en la pestaña <b>Capas</b>;
      la pestaña <b>Explorar</b> busca municipios y distritos. En la pestaña <b>Validar</b> se registran puntos y polígonos
      de validación de la cobertura (clase y cultivo observados en campo).</p>
      <h4>Fuentes</h4>
      <ul>
        <li><b>Cuenca</b>: Titicaca – Desaguadero – Mauri – Caplina (HydroBASINS).</li>
        <li><b>Municipios y distritos</b>: Bolivia, municipios 2024; Perú, distritos (límites adm3, per_admin_boundaries). Se muestran los que tienen al menos 1 % de su superficie en la cuenca.</li>
        <li><b>Carreteras y localidades</b>: © colaboradores de OpenStreetMap (ODbL), extraídos el 2 nov. 2026.</li>
        <li><b>Áreas agrícolas – Perú</b>: capa Living Lab (MINAGRI, interpretación de Sentinel-2 2017–2018 y RapidEye 2012), reunida en el pre-survey 2026.</li>
        <li><b>Áreas agrícolas clasificadas – Bolivia</b>: mezclas de cultivos por clase (%), reunidas en el pre-survey 2026.</li>
        <li><b>Área agrícola total de la cuenca</b>: TDPS, reunida en el pre-survey 2026.</li>
        <li><b>Tierras de cultivo 2024</b>: clasificación creada por el proyecto TRANSCEND (The University of Manchester) con imágenes HLS (Harmonized Landsat Sentinel-2) y clasificación supervisada con el algoritmo de aprendizaje automático Random Forest; resolución de 30 m. Es la única capa producida por la UoM.</li>
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
    helpOpen: 'User guide',
    tut: {
      stepOf: 'Step {n} of {t}', pages: 'Guide pages',
      next: 'Next', back: 'Back', skip: 'Skip', done: 'Get started', close: 'Close',
      steps: [
        { t: 'Welcome to the TRANSCEND WebGIS', alt: 'Overview of the WebGIS with the basin map',
          d: 'Viewer of the Lake Titicaca basin (Peru and Bolivia) with the fieldwork layers. In 6 steps you will see how to <b>explore the map</b> and how to <b>record land-cover validations</b>. You can reopen this guide at any time with the <b>?</b> button at the top.' },
        { t: 'Layers and base map', alt: 'Layers panel and base map selector',
          d: 'In the <b>Layers</b> tab turn each layer on or off, adjust its opacity, zoom to it (magnifier) or download it as GeoJSON (arrow). The <b>Base map</b> button, top left of the map, changes the background: satellite, terrain, streets or light.' },
        { t: 'Explore and query', alt: 'Searching for a district and its information card',
          d: 'In <b>Explore</b> type the name of a municipality or district and pick it from the list: the map zooms in and its card appears. <b>Click any feature on the map</b> (agricultural area, road, municipality) to see its data.' },
        { t: 'Register to validate', alt: 'Registration form with name, email, institution and role',
          d: 'In the <b>Validate</b> tab, register <b>only once</b> with your name, email, institution and role, and accept the use of your data. Only the project lead can see your details; on the map each person sees only their own validations.' },
        { t: 'Place a point or draw a polygon', alt: 'Validation form with class and crop type',
          d: 'Use <b>Place point</b> or <b>Draw polygon</b> (also on the buttons at the right of the map). For a polygon, click each vertex and close it on the first one or with <b>Finish</b>. Choose the <b>class</b> and, for agriculture, the <b>crop type</b>; press <b>Save</b>.' },
        { t: 'Review and send', alt: 'Panel with drafts and the Send validations button',
          d: 'What you save stays as a <b>draft</b> on your device (dashed outline): click it to <b>edit or delete</b> it. When ready, press <b>Send validations</b>. Without internet, they are sent automatically when the connection returns. You are ready to start!' },
      ],
    },
    subtitle: 'Lake Titicaca basin · Peru and Bolivia',
    tabsLabel: 'Panels',
    tabLayers: 'Layers', tabExplore: 'Explore', tabValidate: 'Validate', tabAbout: 'About',
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
      agri_peru: ['Agricultural areas – Peru', 'Living Lab (MINAGRI) · 2026 pre-survey'],
      agri_bolivia: ['Classified agricultural areas – Bolivia', '2026 pre-survey · crop mix (%)'],
      tdps: ['Total agricultural area of the basin', 'TDPS · 2026 pre-survey · Peru and Bolivia'],
      cropland: ['Cropland 2024', 'TRANSCEND (UoM) · HLS + Random Forest, 30 m'],
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
    val: {
      title: 'Field validation',
      intro: 'Place a point or draw a polygon on the map and record the land cover you observed. “Save” creates a draft on this device; review it and press “Send” to submit your validations. The map shows only your own validations.',
      needUser: 'Before validating, register with your name, email, institution and role.',
      register: 'Register', change: 'Change',
      point: 'Point', polygon: 'Polygon',
      drawPoint: 'Place point', drawPolygon: 'Draw polygon',
      ctrlPoint: 'Validate with a point', ctrlPolygon: 'Validate with a polygon',
      hintPoint: 'Click on the map to place the point.',
      hintPolygon: 'Click to add vertices; click the first one or “Finish” to close.',
      undo: 'Undo vertex', finish: 'Finish', cancel: 'Cancel', save: 'Save',
      userTitle: 'User registration',
      userIntro: 'These details are attached to every validation you record.',
      name: 'Full name', email: 'Email', institution: 'Institution', role: 'Role / position',
      privacy: 'Your personal data (name, email, institution and role) are stored with your validations in a protected database that only the TRANSCEND project lead (The University of Manchester) can access. They are used only to identify the source of each record and are never published or shared. You may ask the project team at any time to correct or delete your data.',
      consent: 'I have read the information above and agree to my data being used for this purpose.',
      saveUser: 'Save and continue',
      newTitle: 'New validation', editTitle: 'Edit validation',
      classLabel: 'Class', cropLabel: 'Crop type', cropOther: 'Specify the crop',
      notes: 'Notes', notesPh: 'Optional: crop condition, irrigation type, sowing date…',
      choose: 'Select…',
      classes: {
        agri_irrigada: 'Irrigated agriculture', agri_secano: 'Rainfed (non-irrigated) agriculture',
        veg_natural: 'Natural vegetation', pastizal: 'Pasture / grassland', humedal: 'Wetland / bofedal', suelo_roca: 'Bare soil / rock',
      },
      crops: {
        papa: 'Potato', papa_amarga: 'Bitter potato (luki)', quinua: 'Quinoa', canahua: 'Cañahua', cebada_grano: 'Barley (grain)',
        cebada_forrajera: 'Forage barley', avena_forrajera: 'Forage oats', alfalfa: 'Alfalfa',
        pasto_cultivado: 'Sown pasture (phalaris, ryegrass, cocksfoot)', haba: 'Broad bean', arveja: 'Pea', oca: 'Oca',
        olluco: 'Olluco / papalisa', isano: 'Mashua (isaño)', tarwi: 'Tarwi (Andean lupin)', trigo: 'Wheat', maiz: 'Maize',
        hortalizas: 'Vegetables (onion, carrot, lettuce…)', descanso: 'Fallow',
        no_ident: 'Crop not identified', otro: 'Other (specify)',
      },
      mine: 'My validations', none: 'You have not recorded any validations yet.', legend: 'Classes',
      download: 'Download my validations (GeoJSON)',
      edit: 'Edit', del: 'Delete', zoom: 'Show on map', myValidation: 'My validation',
      confirmDelete: 'Delete this validation?',
      deleteFail: 'Could not delete on the server. Check the connection and try again.',
      created: 'Date', status: 'Status', area: 'Area',
      st: { draft: 'Draft (not sent)', sent: 'Sent', pending: 'Waiting to be sent', rejected: 'Rejected: review and edit', local: 'Only in this browser' },
      draftsN: 'You have {n} draft validation(s), saved only on this device. Review and send them.',
      sendDrafts: 'Send validations ({n})',
      localOnly: 'The WebGIS was opened without its server (local file): validations are kept only in this browser. Download them as GeoJSON.',
      rejectedN: 'The server rejected {n} validation(s) because of invalid data. Open them on the map, review and save again.',
      tooMany: 'Too many submissions in a row; will retry in a few minutes.',
      sending: 'Sending validations…',
      pendingN: 'Waiting to be sent: {n}. They are sent automatically when online.',
      sendError: 'Last attempt: {e}',
      sendNow: 'Send now',
      allSent: 'All your validations have been sent.',
    },
    about: `
      <h3>TRANSCEND · WebGIS</h3>
      <p>Viewer of the datasets used for the TRANSCEND fieldwork in the Lake Titicaca basin (Peru and Bolivia).
      Click on the map to see the data of each feature. Turn layers on and off in the <b>Layers</b> tab;
      the <b>Explore</b> tab searches municipalities and districts. The <b>Validate</b> tab records land-cover validation
      points and polygons (class and crop observed in the field).</p>
      <h4>Sources</h4>
      <ul>
        <li><b>Basin</b>: Titicaca – Desaguadero – Mauri – Caplina (HydroBASINS).</li>
        <li><b>Municipalities and districts</b>: Bolivia, municipalities 2024; Peru, districts (adm3 boundaries, per_admin_boundaries). Those with at least 1% of their area in the basin are shown.</li>
        <li><b>Roads and settlements</b>: © OpenStreetMap contributors (ODbL), extracted 2 Nov 2026.</li>
        <li><b>Agricultural areas – Peru</b>: Living Lab layer (MINAGRI, interpreted from Sentinel-2 2017–2018 and RapidEye 2012), compiled in the 2026 pre-survey.</li>
        <li><b>Classified agricultural areas – Bolivia</b>: crop mixes per class (%), compiled in the 2026 pre-survey.</li>
        <li><b>Total agricultural area of the basin</b>: TDPS, compiled in the 2026 pre-survey.</li>
        <li><b>Cropland 2024</b>: classification produced by the TRANSCEND project (The University of Manchester) from HLS (Harmonized Landsat Sentinel-2) imagery using supervised classification with the Random Forest machine-learning algorithm; 30 m resolution. It is the only layer produced by the UoM.</li>
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
