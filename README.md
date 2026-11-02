# TRANSCEND · WebGIS

Visor web de las bases del trabajo de campo en la cuenca del lago Titicaca (Perú y Bolivia), con
**validación en campo** (puntos y polígonos con clase de cobertura y cultivo).
Interfaz en **español** y **inglés** (botones ES / EN), tema claro u oscuro.
Web viewer of the fieldwork datasets for the Lake Titicaca basin (Peru and Bolivia), with field validation.

El proyecto es un **servidor Node.js (Express)** pensado para **Render**: sirve el sitio (`public/`) y la API
`/api/validacoes`, que guarda las validaciones en **Supabase (PostgreSQL + PostGIS)**.

## Seguridad

- **Ninguna clave en el código ni en el GitHub.** La clave secreta de Supabase solo existe en las variables de
  entorno de Render (o en `.env` local, que el `.gitignore` excluye). El navegador habla solo con el propio
  servidor, que funciona como proxy hacia el banco.
- **Datos personales cerrados.** La tabla tiene RLS sin políticas y las claves públicas no tienen ningún permiso:
  nadie de fuera puede leer nombres, correos ni contribuciones. Solo el responsable del proyecto los ve
  (panel de Supabase o QGIS). Cada usuario ve en el mapa solo lo que él mismo creó.
- **Límite de intentos:** 20 envíos por minuto y 300 por día por IP en el servidor, más un límite en el banco
  (también por IP, y 5000 por día en total). La IP se guarda solo como hash.
- **Validación doble:** el servidor acepta solo los campos conocidos, con tipo y tamaño correctos (máx. 200 kB por
  envío, puntos y polígonos dentro de la región); el banco vuelve a revisar todo con restricciones `check`.
- **CORS cerrado:** la API responde solo al propio sitio (otros orígenes reciben 403), salvo los dominios que se
  pongan en `ALLOWED_ORIGINS`.
- **Cabeceras de seguridad** (helmet): CSP estricta (solo scripts propios), HSTS, `X-Frame-Options: DENY`,
  `nosniff`. Los errores nunca devuelven detalles internos.
- **Consentimiento (LGPD/GDPR):** el usuario acepta el uso de sus datos al registrarse; la fecha queda en
  `consent_at` de cada validación.

## Publicar en Render (una vez)

1. **Banco** — en Supabase: *SQL Editor › New query*, pegue todo `supabase/setup.sql` y pulse **Run**
   (se puede repetir sin perder datos).
2. **Clave secreta** — Supabase › *Project Settings › API Keys* › **Secret keys** › copie la clave `sb_secret_…`.
   No la pegue en ningún archivo del proyecto.
3. **Render** — <https://dashboard.render.com> › *New › Blueprint* › conecte el repositorio
   `ScriptsRemote/webgis_trasncend`. Render lee `render.yaml` y pide las variables:
   - `SUPABASE_URL` = la *Project URL* (Supabase › Project Settings › Data API)
   - `SUPABASE_SECRET_KEY` = la clave `sb_secret_…`
   - `ALLOWED_ORIGINS` = vacío (solo si otro sitio debe usar la API)
4. Render instala, arranca y verifica `/healthz`. Cada `git push` en `main` publica de nuevo.

En el plan gratuito, el servicio se duerme tras 15 min sin uso; la primera visita después tarda ~1 min.

## Ejecutar en la computadora

```
npm install
copy .env.example .env      (complete SUPABASE_URL y SUPABASE_SECRET_KEY)
npm run dev                 → http://localhost:3000
```

Sin `.env` el mapa funciona igual, pero la API responde «servidor no disponible» y las validaciones quedan
pendientes en el navegador. Abrir `public/index.html` con doble clic también funciona (modo local, sin envío).

## Capas / Layers

| Capa | Archivo | Fuente |
|---|---|---|
| Cuenca de estudio | `public/data/basin.js` | HydroBASINS (Titicaca – Desaguadero – Mauri – Caplina) |
| Municipios (Bolivia) y distritos (Perú) en la cuenca, ≥ 1 % del área | `public/data/municipalities.js` | Bolivia municipios 2024; Perú per_admin_boundaries (adm3) |
| Carreteras principales (troncal, primaria, secundaria) | `public/data/roads.js` | © OpenStreetMap, 2 nov. 2026 |
| Ciudades y pueblos | `public/data/places.js` | © OpenStreetMap |
| Áreas agrícolas – Perú | `public/data/agri_peru.js` | Living Lab (MINAGRI), reunida en el pre-survey 2026 |
| Áreas agrícolas clasificadas – Bolivia | `public/data/agri_bolivia.js` | Pre-survey 2026 (mezcla de cultivos por clase) |
| Área agrícola total de la cuenca (TDPS) | `public/tiles/tdps/` | TDPS, reunida en el pre-survey 2026 |
| **Tierras de cultivo 2024** (activa al abrir) | `public/tiles/cropland/` | **Proyecto TRANSCEND (UoM)**: imágenes HLS + clasificación supervisada Random Forest (machine learning), 30 m. Única capa producida por la UoM |

Cada capa vectorial se puede descargar en GeoJSON (`public/data/download/`) desde el panel de capas.

## Validación en campo / Field validation

Pestaña **Validar**: el usuario se registra una vez (nombre, correo, institución, cargo y consentimiento), marca
un **punto** o dibuja un **polígono** y elige la clase; en las dos clases de agricultura elige también el cultivo.
Sin internet el registro queda «pendiente» y se envía solo cuando vuelve la conexión.

| Clase (`land_class`) | Cultivo (`crop`, solo agricultura) |
|---|---|
| `agri_irrigada` Agricultura irrigada · `agri_secano` Agricultura no irrigada | `papa`, `papa_amarga`, `quinua`, `canahua`, `cebada_grano`, `cebada_forrajera`, `avena_forrajera`, `alfalfa`, `pasto_cultivado`, `haba`, `arveja`, `oca`, `olluco`, `isano`, `tarwi`, `trigo`, `maiz`, `hortalizas`, `descanso`, `no_ident`, `otro` (+ `crop_other`) |
| `veg_natural` Vegetación natural · `pastizal` Pastizal · `humedal` Humedal / bofedal · `suelo_roca` Suelo desnudo / roca | — |

Para cambiar las listas hay que cambiar, juntos: `public/js/validacao.js` (`CLASSES`, `CROPS`),
`public/js/i18n.js` (`val.classes`, `val.crops`), `server/validar.js` y los `check` de `supabase/setup.sql`.

### Ver y exportar los datos (solo el responsable)

- Supabase › **Table Editor › validations** (exportar a CSV).
- **QGIS**: *Capa › Añadir capa › PostgreSQL*, con los datos de Supabase › **Connect › Session pooler**;
  la columna `geom` (EPSG:4326) se abre como capa.
- **GeoJSON** desde el SQL Editor:
  ```sql
  select json_build_object('type','FeatureCollection','features', json_agg(ST_AsGeoJSON(v.*)::json))
  from public.validations v;
  ```

## Estructura

```
Webgis/
├── server/
│   ├── index.js          arranca el servidor (Render / local)
│   ├── app.js            Express: sitio, API, CORS, límites, cabeceras de seguridad
│   ├── validar.js        revisión de cada validación antes del banco
│   └── supabase.js       acceso a Supabase con la clave secreta (variables de entorno)
├── public/               sitio (lo único que se sirve en la web)
│   ├── index.html
│   ├── css/style.css     estilo (patrón de la Plataforma AmbGEO, colores UoM)
│   ├── js/app.js         mapa, capas, búsqueda, consulta por clic
│   ├── js/validacao.js   validación en campo (registro, dibujo, envío a /api)
│   ├── js/i18n.js        textos ES / EN
│   ├── js/tema.js        tema claro / oscuro
│   ├── vendor/           Leaflet 1.9.4, Leaflet-Geoman 2.17
│   ├── data/             capas vectoriales + meta.js + download/*.geojson
│   ├── tiles/            teselas PNG (z5–z12) de las dos capas de cultivo
│   └── assets/           logo
├── supabase/setup.sql    tabla, funciones y permisos del banco (PostGIS)
├── render.yaml           configuración de Render
├── .env.example          variables de entorno (copiar a .env; .env no va al GitHub)
└── scripts/build_webgis_data.py   regenera public/data y public/tiles a partir de 3_FieldWork
```

## Actualizar los datos

```
pip install geopandas pyogrio rasterio pillow
python scripts/build_webgis_data.py "C:/Users/b61237cs/Documents/TRANSCEND/3_FieldWork"
```

El script lee `Bolivia/data/Bolivia_data.gpkg`, `Peru/data/Peru_data.gpkg`, `shared/shared_data.gpkg`
y `shared/Cropland_2024_basin.tif`, recorta a la cuenca, simplifica (≈ 10 m) y escribe `public/data/` y `public/tiles/`.

Notas: las geometrías están simplificadas para la web; para análisis use los GeoPackages originales.
Las carreteras y localidades (OSM) vienen de `shared/osm_basin.gpkg`, descargado para toda la cuenca el 2 nov. 2026.
