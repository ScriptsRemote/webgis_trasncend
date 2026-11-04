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
          d: 'En <b>Explorar</b> escriba el nombre de un municipio o distrito y elíjalo en la lista: el mapa se acerca y aparece su ficha. Haga <b>clic en cualquier elemento del mapa</b> (carretera, municipio, pueblo) para ver sus datos.' },
        { t: 'Indique su perfil', alt: 'Formulario de perfil con institución y cargo',
          d: 'En la pestaña <b>Validar</b>, indique <b>una sola vez</b> la <b>institución</b> que representa y su <b>cargo general</b>. <b>No pedimos nombre ni correo.</b> En el mapa cada persona ve solo sus propias validaciones.' },
        { t: 'Marque un punto o dibuje un polígono', alt: 'Cuestionario de validación',
          d: 'Use <b>Marcar punto</b> (recomendado: en el centro de un área homogénea de al menos ~100 × 100 m) o <b>Dibujar polígono</b> (área homogénea de 1 a 25 ha; máx. 500 ha). Responda: <b>¿es tierra de cultivo?</b> Si sí, los <b>cultivos principales</b> y el <b>acceso a riego</b>; si no, la <b>cobertura del suelo</b>. Pulse <b>Guardar</b>.' },
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
      cropland: ['Mapa de cultivo 2022–2024', 'TRANSCEND (UoM) · HLS + Random Forest, 30 m'],
      cropland_2024: ['Mapa de cultivo 2024', 'TRANSCEND (UoM) · mapa anual, 30 m'],
      cropland_2023: ['Mapa de cultivo 2023', 'TRANSCEND (UoM) · mapa anual, 30 m'],
      cropland_2022: ['Mapa de cultivo 2022', 'TRANSCEND (UoM) · mapa anual, 30 m'],
    },
    cls: {
      mun: 'Municipio (Bolivia) / distrito (Perú)', basinLine: 'Límite de la cuenca',
      trunk: 'Carretera troncal nacional', primary: 'Carretera primaria', secondary: 'Carretera secundaria',
      city: 'Ciudad', town: 'Pueblo', cropland: 'Cultivo en 2 o más de los 3 años (2022–2024)', croplandYear: 'Cultivo en',
    },
    pp: {
      municipality: 'Municipio', district: 'Distrito', road: 'Carretera', place: 'Localidad',
      country: 'País', department: 'Departamento', region: 'Región', province: 'Provincia', area: 'Superficie',
      inBasin: 'En la cuenca', study: 'Área de estudio', yes: 'Sí', no: 'No', class: 'Clase',
      ref: 'Ruta', name: 'Nombre', roadClass: 'Tipo', surface: 'Superficie de rodadura',
      town: 'Pueblo', city: 'Ciudad', code: 'Código', noName: 'Sin nombre',
    },
    countries: { Peru: 'Perú', Bolivia: 'Bolivia' },
    summary: 'Resumen de la cuenca',
    cards: { mun: 'municipios / distritos', places: 'ciudades y pueblos', basinArea: 'km² de cuenca', roads: 'km de carreteras principales' },
    val: {
      title: 'Validación en campo',
      intro: 'Marque un punto o dibuje un polígono sobre el mapa y responda unas preguntas sobre el área. «Guardar» crea un borrador en este aparato; revise y pulse «Enviar» para mandar sus validaciones. En el mapa solo se ven sus propias validaciones.',
      needUser: 'Antes de validar, indique la institución que representa y su cargo. No pedimos nombre ni correo.',
      register: 'Indicar perfil', change: 'Cambiar',
      point: 'Punto', polygon: 'Polígono',
      drawPoint: 'Marcar punto', drawPolygon: 'Dibujar polígono',
      ctrlPoint: 'Validar con un punto', ctrlPolygon: 'Validar con un polígono',
      hintPoint: 'Haga clic en el centro de un área homogénea (de al menos ~100 × 100 m).',
      hintPolygon: 'Contorne un área homogénea de 1 a 25 ha (máx. 500 ha). Clic en el primer vértice o en «Terminar» para cerrar.',
      undo: 'Deshacer vértice', finish: 'Terminar', cancel: 'Cancelar', save: 'Guardar',
      guideTitle: '¿Punto o polígono? ¿De qué tamaño?',
      guide: `<ul>
        <li><b>Punto (recomendado):</b> más rápido y preciso. Colóquelo en el <b>centro de un área homogénea</b> de al menos ~100 × 100 m (≈ 1 ha, unos 3 × 3 píxeles del mapa de 30 m), lejos de bordes, caminos y casas.</li>
        <li><b>Polígono:</b> para un área homogénea bien delimitada (una parcela o un grupo de parcelas con el mismo uso). Tamaño recomendado: <b>de 1 a 25 ha</b> (de 100 × 100 m a 500 × 500 m). No se aceptan polígonos de más de <b>500 ha</b>: divida las áreas grandes.</li>
        <li><b>Un registro = una sola cobertura.</b> Si el área mezcla cultivo y no cultivo, haga registros separados.</li>
      </ul>`,
      userTitle: 'Su perfil',
      userIntro: 'Para saber qué tipo de institución aporta cada validación. No pedimos su nombre ni su correo.',
      institution: 'Institución que representa', institutionPh: 'Ej.: municipio, ministerio, universidad, ONG…',
      role: 'Cargo o función (general)',
      roles: {
        tecnico: 'Técnico/a de campo o extensionista', investigador: 'Investigador/a o docente',
        funcionario: 'Funcionario/a público/a (gestión, planificación)', ong: 'Personal de ONG o proyecto de cooperación',
        productor: 'Productor/a o dirigente de productores', estudiante: 'Estudiante', otro: 'Otro',
      },
      privacy: 'No se recogen nombres, correos ni otros datos personales: solo la institución y el cargo general que usted indique, guardados con sus validaciones en una base protegida a la que solo accede el equipo del proyecto TRANSCEND (The University of Manchester). Las validaciones se usan para evaluar y mejorar el mapa de cultivo.',
      consent: 'Leí la información anterior y acepto que mis respuestas se usen para este fin.',
      saveUser: 'Guardar y continuar',
      newTitle: 'Nueva validación', editTitle: 'Editar validación',
      qCrop: '¿Esta área es tierra de cultivo?', yes: 'Sí', no: 'No',
      qCrops: '¿Cuáles son los principales cultivos de esta área?', multiHelp: 'Marque uno o más.',
      cropOther: 'Especifique el cultivo',
      qIrrigation: '¿Los agricultores tienen acceso a riego en las parcelas de esta área?',
      irrigation: { si: 'Sí', no: 'No: solo lluvia (secano)', no_sabe: 'No sé' },
      qIrrType: 'Tipo de riego', qSource: 'Fuente del agua',
      irrTypes: { superficie: 'Gravedad / superficie (surcos, inundación)', aspersion: 'Aspersión', goteo: 'Goteo', otro: 'Otro', no_sabe: 'No sé' },
      sources: {
        rio: 'Río o arroyo', lago: 'Lago o laguna', manantial: 'Manantial / ojo de agua', pozo: 'Pozo (agua subterránea)',
        represa: 'Represa o reservorio', qocha: 'Qocha / cosecha de agua de lluvia', otro: 'Otra', no_sabe: 'No sé',
      },
      qCover: '¿Cuál es la cobertura del suelo en esta área?',
      covers: { veg_natural: 'Vegetación natural', pastizal: 'Pastizal / pastos', humedal: 'Humedal / bofedal', suelo_roca: 'Suelo desnudo / roca', otro: 'Otra (especifique)' },
      coverOther: 'Especifique la cobertura',
      pickOne: 'Marque al menos una opción.',
      notes: 'Observaciones', notesPh: 'Opcional: estado del cultivo, fecha de siembra, otros detalles…',
      choose: 'Seleccione…',
      sizeSmall: 'Área pequeña ({a} ha): lo ideal es al menos 1 ha (≈ 100 × 100 m), para poder compararla con el mapa de 30 m.',
      sizeLarge: 'Área grande ({a} ha): confirme que toda el área es homogénea; lo recomendado es hasta 25 ha.',
      tooBig: 'El polígono tiene {a} ha y el máximo es {max} ha. Dibuje un área homogénea más pequeña (o divídala en varias).',
      crops: {
        papa: 'Papa', papa_amarga: 'Papa amarga (luki)', quinua: 'Quinua', canahua: 'Cañahua', cebada_grano: 'Cebada (grano)',
        cebada_forrajera: 'Cebada forrajera', avena_forrajera: 'Avena forrajera', alfalfa: 'Alfalfa',
        pasto_cultivado: 'Pasto cultivado (falaris, ryegrass, dactylis)', haba: 'Haba', arveja: 'Arveja', oca: 'Oca',
        olluco: 'Olluco / papalisa', isano: 'Isaño', tarwi: 'Tarwi', trigo: 'Trigo', maiz: 'Maíz',
        hortalizas: 'Hortalizas (cebolla, zanahoria, lechuga…)', descanso: 'En descanso / barbecho',
        otro: 'Otro (especifique)', no_sabe: 'No sé',
      },
      cats: {
        cult_riego: 'Cultivo con riego', cult_secano: 'Cultivo a secano (solo lluvia)', cult_nosabe: 'Cultivo (riego: no sabe)',
        veg_natural: 'Vegetación natural', pastizal: 'Pastizal / pastos', humedal: 'Humedal / bofedal', suelo_roca: 'Suelo desnudo / roca',
        otro: 'Otra cobertura',
      },
      isCropLabel: '¿Cultivo?', cropsLabel: 'Cultivos', irrigationLabel: 'Riego', coverLabel: 'Cobertura',
      mine: 'Mis validaciones', none: 'Aún no registró validaciones.', legend: 'Leyenda',
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
      para validar el mapa de cultivo: si el área es cultivo, qué se cultiva y si tiene riego, o qué cobertura tiene.</p>
      <h4>Fuentes</h4>
      <ul>
        <li><b>Cuenca</b>: Titicaca – Desaguadero – Mauri – Caplina (HydroBASINS).</li>
        <li><b>Municipios y distritos</b>: Bolivia, municipios 2024; Perú, distritos (límites adm3, per_admin_boundaries). Se muestran los que tienen al menos 1 % de su superficie en la cuenca.</li>
        <li><b>Carreteras y localidades</b>: © colaboradores de OpenStreetMap (ODbL), extraídos el 2 nov. 2026.</li>
        <li><b>Mapa de cultivo 2022–2024</b>: producido por el proyecto TRANSCEND (The University of Manchester) con imágenes HLS (Harmonized Landsat Sentinel-2) y clasificación supervisada con el algoritmo de aprendizaje automático Random Forest; resolución de 30 m. Es un compuesto de los mapas anuales de 2022, 2023 y 2024: un píxel es cultivo cuando fue clasificado como cultivo en al menos 2 de los 3 años. Es el mapa que se valida en campo. Los mapas de cada año también están disponibles como capas (apagadas al abrir), para comparar.</li>
        <li><b>Mapas base</b>: Esri, Maxar, Earthstar Geographics; © OpenStreetMap.</li>
      </ul>
      <h4>Notas</h4>
      <ul>
        <li>Las geometrías se simplificaron para la web (tolerancia ≈ 10 m). Use los archivos originales para cálculos.</li>
        <li>Los mapas de cultivo se muestran como imagen (teselas) hasta el zoom 12.</li>
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
          d: 'In <b>Explore</b> type the name of a municipality or district and pick it from the list: the map zooms in and its card appears. <b>Click any feature on the map</b> (road, municipality, town) to see its data.' },
        { t: 'Enter your profile', alt: 'Profile form with institution and position',
          d: 'In the <b>Validate</b> tab, enter <b>only once</b> the <b>institution</b> you represent and your <b>general position</b>. <b>We do not ask for your name or email.</b> On the map each person sees only their own validations.' },
        { t: 'Place a point or draw a polygon', alt: 'Validation questionnaire',
          d: 'Use <b>Place point</b> (recommended: in the centre of a uniform area of at least ~100 × 100 m) or <b>Draw polygon</b> (uniform area of 1 to 25 ha; max. 500 ha). Answer: <b>is this cropland?</b> If yes, the <b>main crops</b> and <b>access to irrigation</b>; if no, the <b>land cover</b>. Press <b>Save</b>.' },
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
      cropland: ['Cropland map 2022–2024', 'TRANSCEND (UoM) · HLS + Random Forest, 30 m'],
      cropland_2024: ['Cropland map 2024', 'TRANSCEND (UoM) · annual map, 30 m'],
      cropland_2023: ['Cropland map 2023', 'TRANSCEND (UoM) · annual map, 30 m'],
      cropland_2022: ['Cropland map 2022', 'TRANSCEND (UoM) · annual map, 30 m'],
    },
    cls: {
      mun: 'Municipality (Bolivia) / district (Peru)', basinLine: 'Basin boundary',
      trunk: 'National trunk road', primary: 'Primary road', secondary: 'Secondary road',
      city: 'City', town: 'Town', cropland: 'Cropland in 2 or more of the 3 years (2022–2024)', croplandYear: 'Cropland in',
    },
    pp: {
      municipality: 'Municipality', district: 'District', road: 'Road', place: 'Settlement',
      country: 'Country', department: 'Department', region: 'Region', province: 'Province', area: 'Area',
      inBasin: 'In the basin', study: 'Study area', yes: 'Yes', no: 'No', class: 'Class',
      ref: 'Route', name: 'Name', roadClass: 'Type', surface: 'Surface',
      town: 'Town', city: 'City', code: 'Code', noName: 'Unnamed',
    },
    countries: { Peru: 'Peru', Bolivia: 'Bolivia' },
    summary: 'Basin summary',
    cards: { mun: 'municipalities / districts', places: 'cities and towns', basinArea: 'km² of basin', roads: 'km of main roads' },
    val: {
      title: 'Field validation',
      intro: 'Place a point or draw a polygon on the map and answer a few questions about the area. “Save” creates a draft on this device; review it and press “Send” to submit your validations. The map shows only your own validations.',
      needUser: 'Before validating, enter the institution you represent and your position. We do not ask for your name or email.',
      register: 'Enter profile', change: 'Change',
      point: 'Point', polygon: 'Polygon',
      drawPoint: 'Place point', drawPolygon: 'Draw polygon',
      ctrlPoint: 'Validate with a point', ctrlPolygon: 'Validate with a polygon',
      hintPoint: 'Click in the centre of a uniform area (at least ~100 × 100 m).',
      hintPolygon: 'Outline a uniform area of 1 to 25 ha (max. 500 ha). Click the first vertex or “Finish” to close.',
      undo: 'Undo vertex', finish: 'Finish', cancel: 'Cancel', save: 'Save',
      guideTitle: 'Point or polygon? How big?',
      guide: `<ul>
        <li><b>Point (recommended):</b> quicker and more precise. Place it in the <b>centre of a uniform area</b> of at least ~100 × 100 m (≈ 1 ha, about 3 × 3 pixels of the 30 m map), away from edges, roads and houses.</li>
        <li><b>Polygon:</b> for a clearly bounded uniform area (one field or a group of fields with the same use). Recommended size: <b>1 to 25 ha</b> (100 × 100 m to 500 × 500 m). Polygons larger than <b>500 ha</b> are not accepted: split large areas.</li>
        <li><b>One record = one land cover.</b> If the area mixes cropland and non-cropland, make separate records.</li>
      </ul>`,
      userTitle: 'Your profile',
      userIntro: 'So we know what type of institution each validation comes from. We do not ask for your name or email.',
      institution: 'Institution you represent', institutionPh: 'E.g. municipality, ministry, university, NGO…',
      role: 'Position or role (general)',
      roles: {
        tecnico: 'Field technician or extension worker', investigador: 'Researcher or lecturer',
        funcionario: 'Public official (management, planning)', ong: 'NGO or development project staff',
        productor: 'Farmer or farmers’ organisation leader', estudiante: 'Student', otro: 'Other',
      },
      privacy: 'No names, emails or other personal data are collected: only the institution and general position you enter, stored with your validations in a protected database that only the TRANSCEND project team (The University of Manchester) can access. The validations are used to assess and improve the cropland map.',
      consent: 'I have read the information above and agree to my answers being used for this purpose.',
      saveUser: 'Save and continue',
      newTitle: 'New validation', editTitle: 'Edit validation',
      qCrop: 'Is this area cropland?', yes: 'Yes', no: 'No',
      qCrops: 'What are the main crop types grown in this area?', multiHelp: 'Tick one or more.',
      cropOther: 'Specify the crop',
      qIrrigation: 'Do farmers have access to irrigation for plots in this area?',
      irrigation: { si: 'Yes', no: 'No: purely rainfed', no_sabe: 'Unsure' },
      qIrrType: 'Type of irrigation', qSource: 'Source of water',
      irrTypes: { superficie: 'Gravity / surface (furrow, flood)', aspersion: 'Sprinkler', goteo: 'Drip', otro: 'Other', no_sabe: 'Unsure' },
      sources: {
        rio: 'River or stream', lago: 'Lake or pond', manantial: 'Spring', pozo: 'Well (groundwater)',
        represa: 'Dam or reservoir', qocha: 'Qocha / rainwater harvesting', otro: 'Other', no_sabe: 'Unsure',
      },
      qCover: 'What is the land cover class in this area?',
      covers: { veg_natural: 'Natural vegetation', pastizal: 'Pasture / grassland', humedal: 'Wetland / bofedal', suelo_roca: 'Bare soil / rock', otro: 'Other (specify)' },
      coverOther: 'Specify the land cover',
      pickOne: 'Tick at least one option.',
      notes: 'Notes', notesPh: 'Optional: crop condition, sowing date, other details…',
      choose: 'Select…',
      sizeSmall: 'Small area ({a} ha): ideally at least 1 ha (≈ 100 × 100 m), so it can be compared with the 30 m map.',
      sizeLarge: 'Large area ({a} ha): check that the whole area is uniform; up to 25 ha is recommended.',
      tooBig: 'The polygon is {a} ha and the maximum is {max} ha. Draw a smaller uniform area (or split it into several).',
      crops: {
        papa: 'Potato', papa_amarga: 'Bitter potato (luki)', quinua: 'Quinoa', canahua: 'Cañahua', cebada_grano: 'Barley (grain)',
        cebada_forrajera: 'Forage barley', avena_forrajera: 'Forage oats', alfalfa: 'Alfalfa',
        pasto_cultivado: 'Sown pasture (phalaris, ryegrass, cocksfoot)', haba: 'Broad bean', arveja: 'Pea', oca: 'Oca',
        olluco: 'Olluco / papalisa', isano: 'Mashua (isaño)', tarwi: 'Tarwi (Andean lupin)', trigo: 'Wheat', maiz: 'Maize',
        hortalizas: 'Vegetables (onion, carrot, lettuce…)', descanso: 'Fallow',
        otro: 'Other (specify)', no_sabe: 'Unsure',
      },
      cats: {
        cult_riego: 'Irrigated cropland', cult_secano: 'Rainfed cropland', cult_nosabe: 'Cropland (irrigation unsure)',
        veg_natural: 'Natural vegetation', pastizal: 'Pasture / grassland', humedal: 'Wetland / bofedal', suelo_roca: 'Bare soil / rock',
        otro: 'Other land cover',
      },
      isCropLabel: 'Cropland?', cropsLabel: 'Crops', irrigationLabel: 'Irrigation', coverLabel: 'Land cover',
      mine: 'My validations', none: 'You have not recorded any validations yet.', legend: 'Legend',
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
      the <b>Explore</b> tab searches municipalities and districts. The <b>Validate</b> tab records points and polygons
      to validate the cropland map: whether the area is cropland, which crops are grown and whether it is irrigated, or its land cover.</p>
      <h4>Sources</h4>
      <ul>
        <li><b>Basin</b>: Titicaca – Desaguadero – Mauri – Caplina (HydroBASINS).</li>
        <li><b>Municipalities and districts</b>: Bolivia, municipalities 2024; Peru, districts (adm3 boundaries, per_admin_boundaries). Those with at least 1% of their area in the basin are shown.</li>
        <li><b>Roads and settlements</b>: © OpenStreetMap contributors (ODbL), extracted 2 Nov 2026.</li>
        <li><b>Cropland map 2022–2024</b>: produced by the TRANSCEND project (The University of Manchester) from HLS (Harmonized Landsat Sentinel-2) imagery using supervised classification with the Random Forest machine-learning algorithm; 30 m resolution. It is a composite of the 2022, 2023 and 2024 annual maps: a pixel is cropland when it was classified as cropland in at least 2 of the 3 years. This is the map being validated in the field. The individual annual maps are also available as layers (off by default) for comparison.</li>
        <li><b>Base maps</b>: Esri, Maxar, Earthstar Geographics; © OpenStreetMap.</li>
      </ul>
      <h4>Notes</h4>
      <ul>
        <li>Geometries were simplified for the web (≈ 10 m tolerance). Use the original files for calculations.</li>
        <li>The cropland maps are shown as images (tiles) up to zoom 12.</li>
        <li>Areas were computed in WGS 84 / UTM 19S.</li>
      </ul>
      <p class="nota">TRANSCEND project · The University of Manchester · November 2026</p>`,
  },
};
