# TRANSCEND · WebGIS

Visor web de las bases del trabajo de campo en la cuenca del lago Titicaca (Perú y Bolivia).
Interfaz en **español** y **inglés** (botones ES / EN), tema claro u oscuro.
Web viewer of the fieldwork datasets for the Lake Titicaca basin (Peru and Bolivia), in Spanish and English.

## Cómo abrir / How to open

- **En la computadora**: doble clic en `index.html` (funciona sin servidor). Los mapas base necesitan internet.
- **Para compartir**: suba la carpeta `Webgis` completa a cualquier hosting estático
  (GitHub Pages, Netlify, Google Cloud Storage, servidor de la universidad). No necesita base de datos.
- Idioma por enlace: `index.html?lang=en` o `index.html?lang=es`.

## Capas / Layers

| Capa | Archivo | Fuente |
|---|---|---|
| Cuenca de estudio | `data/basin.js` | HydroBASINS (Titicaca – Desaguadero – Mauri – Caplina) |
| Municipios (Bolivia) y distritos (Perú) en la cuenca, ≥ 1 % del área | `data/municipalities.js` | Bolivia municipios 2024; Perú per_admin_boundaries (adm3) |
| Carreteras principales (troncal, primaria, secundaria) | `data/roads.js` | © OpenStreetMap, 2 nov. 2026 |
| Ciudades y pueblos | `data/places.js` | © OpenStreetMap |
| Áreas agrícolas UoM – Perú | `data/agri_peru.js` | Pre-survey UoM 2026 (Living Lab, MINAGRI) |
| Áreas agrícolas clasificadas UoM – Bolivia | `data/agri_bolivia.js` | Pre-survey UoM 2026 |
| Área agrícola total de la cuenca (TDPS) | `tiles/tdps/` | Pre-survey UoM 2026 |
| Tierras de cultivo 2024 | `tiles/cropland/` | Clasificación UoM, 30 m |

Cada capa vectorial se puede descargar en GeoJSON (`data/download/`) desde el panel de capas.

## Estructura

```
Webgis/
├── index.html            página
├── css/style.css         estilo (patrón de la Plataforma AmbGEO, colores UoM)
├── js/app.js             mapa, capas, búsqueda, consulta por clic
├── js/i18n.js            textos ES / EN
├── js/tema.js            tema claro / oscuro
├── vendor/               Leaflet 1.9.4
├── data/                 capas vectoriales (formato compacto) + meta.js + download/*.geojson
├── tiles/                teselas PNG (z5–z12) de las dos capas de cultivo de la cuenca
├── assets/               logo
└── scripts/build_webgis_data.py   regenera data/ y tiles/ a partir de 3_FieldWork
```

## Actualizar los datos

```
pip install geopandas pyogrio rasterio pillow
python scripts/build_webgis_data.py "C:/Users/b61237cs/Documents/TRANSCEND/3_FieldWork"
```

El script lee `Bolivia/data/Bolivia_data.gpkg`, `Peru/data/Peru_data.gpkg`, `shared/shared_data.gpkg`
y `shared/Cropland_2024_basin.tif`, recorta a la cuenca, simplifica (≈ 10 m) y escribe `data/` y `tiles/`.

Notas: las geometrías están simplificadas para la web; para análisis use los GeoPackages originales.
Las carreteras y localidades (OSM) vienen de `shared/osm_basin.gpkg`, descargado para toda la cuenca el 2 nov. 2026.
