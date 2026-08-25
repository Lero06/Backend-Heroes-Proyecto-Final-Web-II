/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: server.js
Autor: Leandro Sanchez Rojas / Adaptado a ESM por Marco Vásquez
Fecha: 22/08/2026
Modulo: Arquitectura Base
Descripcion:
Punto de entrada del backend. Inicia el servidor HTTP escuchando en el
puerto dinamico asignado por Railway/Render (process.env.PORT) y en 0.0.0.0.
//////////////////////////////////////////////////////////
*/

import 'dotenv/config';

// Capturar el puerto de Railway antes de cargar variables locales de .env
const PORT_RAILWAY = process.env.PORT;

import app from './app.js';
import pool from './config/db.js';

// Si Railway proporciono un puerto, usarlo; de lo contrario usar 4000 para desarrollo local
const PORT = Number(PORT_RAILWAY || process.env.PORT || 4000);

async function iniciar() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Escuchando exitosamente en http://0.0.0.0:${PORT}`);
  });

  try {
    await pool.query('SELECT 1');
    console.log('[MYSQL] Conexion a la base de datos exitosa');
  } catch (err) {
    console.error('[MYSQL ERROR] No se pudo conectar a la base de datos:', err.message);
  }
}

iniciar();
