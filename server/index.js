/* =============================================================================
   index.js — arranca el servidor (local o Render).
   Variables de entorno: ver .env.example. En local se leen de .env.
   ========================================================================== */
'use strict';

try { process.loadEnvFile(); } catch (e) { /* sin .env: se usan las variables de la nube */ }

const criarApp = require('./app');
const { configurado } = require('./supabase');

const PORT = Number(process.env.PORT) || 3000;
if (!configurado) console.warn('[aviso] SUPABASE_URL / SUPABASE_SECRET_KEY no definidas: el mapa funciona, pero las validaciones no se guardan en el banco.');

const servidor = criarApp().listen(PORT, () => console.log(`TRANSCEND WebGIS en http://localhost:${PORT}`));
process.on('SIGTERM', () => servidor.close(() => process.exit(0)));
