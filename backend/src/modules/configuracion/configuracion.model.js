/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: configuracion.model.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Configuración del Sistema
Descripcion:
Acceso a datos para la tabla `configuracion`. Permite consultar y
modificar parametros globales del sistema, como el rango de IP permitido.
//////////////////////////////////////////////////////////
*/

import pool from '../../config/db.js';

/**
 * Obtiene todos los parametros de configuracion.
 * @returns {Promise<Array>} Lista de configuraciones.
 */
export async function obtenerTodas() {
  const [rows] = await pool.query('SELECT id, clave, valor, descripcion FROM configuracion');
  return rows;
}

/**
 * Obtiene el valor de un parametro especifico por su clave.
 * @param {string} clave - Clave de configuracion (ej. 'rango_ip_permitido').
 * @returns {Promise<object|null>} Registro de configuracion o null.
 */
export async function obtenerPorClave(clave) {
  const [rows] = await pool.query('SELECT id, clave, valor, descripcion FROM configuracion WHERE clave = ?', [
    clave,
  ]);
  return rows[0] || null;
}

/**
 * Actualiza el valor de un parametro de configuracion por su clave.
 * @param {string} clave - Clave de configuracion.
 * @param {string} valor - Nuevo valor a guardar.
 * @returns {Promise<boolean>} true si se modifico el registro.
 */
export async function actualizarValor(clave, valor) {
  const [result] = await pool.query(
    'UPDATE configuracion SET valor = ? WHERE clave = ?',
    [valor, clave]
  );
  return result.affectedRows > 0;
}
