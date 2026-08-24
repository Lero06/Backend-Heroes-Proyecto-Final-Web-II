/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: marcas.model.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Marcas (Entrada/Salida)
Descripcion:
Acceso a datos para la tabla `marcas` y lectura del rango de IP en
la tabla `configuracion`. Permite registrar marcas, consultar la ultima
marca del usuario y listar el historial de marcas con calculo de duracion.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import pool from '../../config/db.js';

/*
//////////////////////////////////////////////////////////
FUNCIONES DE ACCESO A DATOS
//////////////////////////////////////////////////////////
*/

/**
 * Obtiene la configuracion del rango de IP permitido desde la tabla `configuracion`.
 * @returns {Promise<string>} Valor de 'rango_ip_permitido' o '0.0.0.0/0' por defecto.
 */
export async function obtenerRangoIpPermitido() {
  const [rows] = await pool.query(
    "SELECT valor FROM configuracion WHERE clave = 'rango_ip_permitido'"
  );
  return rows[0]?.valor || '0.0.0.0/0';
}

/**
 * Obtiene la ultima marca registrada por un usuario.
 * @param {number} usuarioId - Id del usuario.
 * @returns {Promise<object|null>} Ultima marca o null si no tiene ninguna.
 */
export async function obtenerUltimaMarcaPorUsuario(usuarioId) {
  const [rows] = await pool.query(
    `SELECT m.id, m.usuario_id, m.dispositivo_id, m.fecha, m.hora, m.tipo, m.ip, m.creado_en,
            u.nombre_completo AS usuario_nombre
     FROM marcas m
     JOIN usuarios u ON u.id = m.usuario_id
     WHERE m.usuario_id = ?
     ORDER BY m.id DESC
     LIMIT 1`,
    [usuarioId]
  );
  return rows[0] || null;
}

/**
 * Registra una nueva marca de entrada o salida.
 * @param {object} datos - Datos de la marca.
 * @param {number} datos.usuario_id - Id del usuario.
 * @param {string} datos.dispositivo_id - UUID del dispositivo.
 * @param {string} datos.fecha - Fecha (YYYY-MM-DD).
 * @param {string} datos.hora - Hora (HH:MM:SS).
 * @param {string} datos.tipo - 'ENTRADA' o 'SALIDA'.
 * @param {string} datos.ip - Direccion IP del cliente.
 * @returns {Promise<number>} ID de la marca insertada.
 */
export async function registrarMarca({ usuario_id, dispositivo_id, fecha, hora, tipo, ip }) {
  const [result] = await pool.query(
    `INSERT INTO marcas (usuario_id, dispositivo_id, fecha, hora, tipo, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuario_id, dispositivo_id, fecha, hora, tipo, ip]
  );
  return result.insertId;
}

/**
 * Obtiene una marca por su ID con datos descriptivos del dispositivo y nombre de usuario.
 * @param {number} id - Id de la marca.
 * @returns {Promise<object|null>} Marca encontrada o null.
 */
export async function obtenerMarcaPorId(id) {
  const [rows] = await pool.query(
    `SELECT m.id, m.usuario_id, m.dispositivo_id, m.fecha, m.hora, m.tipo, m.ip, m.creado_en,
            u.nombre_completo AS usuario_nombre,
            d.nombre AS dispositivo_nombre
     FROM marcas m
     JOIN usuarios u ON u.id = m.usuario_id
     LEFT JOIN dispositivos d ON d.id = m.dispositivo_id
     WHERE m.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Obtiene el historial completo de marcas de un usuario especifico con nombre completo de usuario.
 * @param {number} usuarioId - Id del usuario.
 * @returns {Promise<Array>} Lista de marcas registradas.
 */
export async function obtenerMarcasPorUsuario(usuarioId) {
  const [rows] = await pool.query(
    `SELECT m.id, m.usuario_id, m.dispositivo_id, m.fecha, m.hora, m.tipo, m.ip, m.creado_en,
            u.nombre_completo AS usuario_nombre,
            d.nombre AS dispositivo_nombre
     FROM marcas m
     JOIN usuarios u ON u.id = m.usuario_id
     LEFT JOIN dispositivos d ON d.id = m.dispositivo_id
     WHERE m.usuario_id = ?
     ORDER BY m.fecha DESC, m.hora DESC`,
    [usuarioId]
  );
  return rows;
}
