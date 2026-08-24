/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: server.js
Autor: Leandro Sanchez Rojas / Adaptado a ESM por Marco Vásquez
Fecha: 22/08/2026
Modulo: Arquitectura Base
Descripcion:
Punto de entrada del backend. Inicia el servidor HTTP en el puerto
configurado (0.0.0.0) para despliegues en la nube (Railway/Render)
y verifica la conexion a MySQL sin bloquear la aplicacion.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import app from './app.js';
import pool from './config/db.js';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const PORT = process.env.PORT || 4000;

/*
//////////////////////////////////////////////////////////
FUNCION PRINCIPAL
//////////////////////////////////////////////////////////
*/

/**
 * Inicializa el servidor HTTP en 0.0.0.0 para permitir el enrutamiento
 * del proxy de Railway/Render y prueba la conexion a la base de datos.
 * @returns {Promise<void>}
 */
async function iniciar() {
  // 1. Escuchar en 0.0.0.0 y process.env.PORT para que Railway pueda enrutar el trafico HTTP
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
  });

  // 2. Verificar conexion a MySQL (si falla, muestra un log de advertencia sin tumbar el proceso)
  try {
    await pool.query('SELECT 1');
    console.log('Conexion a MySQL exitosa');
  } catch (err) {
    console.error('Advertencia BD: No se pudo conectar a MySQL:', err.message);
    console.error('Revisa que las variables DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD esten bien configuradas en Railway.');
  }
}

iniciar();
