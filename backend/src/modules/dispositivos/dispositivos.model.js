/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: dispositivos.model.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Dispositivos Autorizados
Descripcion:
Acceso a datos para la tabla `dispositivos`. Permite registrar,
consultar, actualizar el estado y eliminar dispositivos autorizados
de los usuarios.
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
 * Registra un nuevo dispositivo en la base de datos.
 * @param {object} datos - Datos del dispositivo.
 * @param {string} datos.id - UUID generado para el dispositivo.
 * @param {number} datos.usuario_id - Id del usuario propietario.
 * @param {string} datos.nombre - Nombre descriptivo del dispositivo (ej. Laptop Trabajo).
 * @param {string} [datos.descripcion] - Detalles opcionales.
 * @returns {Promise<boolean>} true si el registro fue insertado con exito.
 */
export async function crearDispositivo({ id, usuario_id, nombre, descripcion }) {
  const [result] = await pool.query(
    `INSERT INTO dispositivos (id, usuario_id, nombre, descripcion, estado)
     VALUES (?, ?, ?, ?, 'ACTIVO')`,
    [id, usuario_id, nombre, descripcion || null]
  );
  return result.affectedRows > 0;
}

/**
 * Busca un dispositivo por su ID (UUID).
 * @param {string} id - UUID del dispositivo.
 * @returns {Promise<object|null>} Datos del dispositivo o null si no se encuentra.
 */
export async function obtenerDispositivoPorId(id) {
  const [rows] = await pool.query(
    `SELECT d.id, d.usuario_id, d.nombre, d.descripcion, d.estado, d.fecha_registro,
            u.nombre_completo AS propietario
     FROM dispositivos d
     JOIN usuarios u ON u.id = d.usuario_id
     WHERE d.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Obtiene todos los dispositivos registrados por un usuario especifico.
 * @param {number} usuarioId - Id del usuario.
 * @returns {Promise<Array>} Lista de dispositivos del usuario.
 */
export async function obtenerDispositivosPorUsuario(usuarioId) {
  const [rows] = await pool.query(
    `SELECT id, nombre, descripcion, estado, fecha_registro
     FROM dispositivos
     WHERE usuario_id = ?
     ORDER BY fecha_registro DESC`,
    [usuarioId]
  );
  return rows;
}

/**
 * Modifica el estado (ACTIVO/INACTIVO) o los datos de un dispositivo.
 * Garantiza que pertenezca al usuario indicado.
 * @param {string} id - UUID del dispositivo.
 * @param {number} usuarioId - Id del usuario propietario.
 * @param {object} campos - Campos a actualizar ({ estado, nombre, descripcion }).
 * @returns {Promise<boolean>} true si se actualizo algun registro.
 */
export async function actualizarDispositivo(id, usuarioId, { estado, nombre, descripcion }) {
  const actualizaciones = [];
  const valores = [];

  if (estado !== undefined) {
    actualizaciones.push('estado = ?');
    valores.push(estado);
  }
  if (nombre !== undefined) {
    actualizaciones.push('nombre = ?');
    valores.push(nombre);
  }
  if (descripcion !== undefined) {
    actualizaciones.push('descripcion = ?');
    valores.push(descripcion);
  }

  if (actualizaciones.length === 0) return false;

  valores.push(id, usuarioId);

  const [result] = await pool.query(
    `UPDATE dispositivos
     SET ${actualizaciones.join(', ')}
     WHERE id = ? AND usuario_id = ?`,
    valores
  );

  return result.affectedRows > 0;
}

/**
 * Elimina un dispositivo de un usuario.
 * @param {string} id - UUID del dispositivo.
 * @param {number} usuarioId - Id del usuario propietario.
 * @returns {Promise<boolean>} true si el registro fue eliminado.
 */
export async function eliminarDispositivo(id, usuarioId) {
  const [result] = await pool.query(
    'DELETE FROM dispositivos WHERE id = ? AND usuario_id = ?',
    [id, usuarioId]
  );
  return result.affectedRows > 0;
}
