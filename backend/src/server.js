/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: server.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Arquitectura Base
Descripcion:
Punto de entrada del backend. Verifica que la conexion a MySQL
funcione antes de levantar el servidor HTTP, para fallar rapido si
Docker o las credenciales de la base de datos no estan bien configuradas.
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
 * Inicializa el servidor: primero valida la conexion a la base de
 * datos y, si es exitosa, levanta el servidor Express.
 * @returns {Promise<void>}
 */
async function iniciar() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexion a MySQL exitosa');
  } catch (err) {
    console.error('No se pudo conectar a MySQL:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

iniciar();
