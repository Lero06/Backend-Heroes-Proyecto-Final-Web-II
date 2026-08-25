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
consultar (por usuario o todos los dispositivos si es admin),
actualizar el estado y eliminar dispositivos autorizados.
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
 * @returns {Promise<boolean>} true si fue insertado con exito.
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
 * @returns {Promise<object|null>} Datos del dispositivo o null.
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
 * @param {string} [dispositivoActualId] - UUID del dispositivo actual.
 * @returns {Promise<Array>} Lista de dispositivos del usuario.
 */
export async function obtenerDispositivosPorUsuario(usuarioId, dispositivoActualId = null) {
  const [rows] = await pool.query(
    `SELECT d.id, d.usuario_id, d.nombre, d.descripcion, d.estado, d.fecha_registro,
            u.nombre_completo AS propietario
     FROM dispositivos d
     JOIN usuarios u ON u.id = d.usuario_id
     WHERE d.usuario_id = ?
     ORDER BY d.fecha_registro DESC`,
    [usuarioId]
  );

  return rows.map((d) => ({
    ...d,
    es_actual: d.id === dispositivoActualId,
  }));
}

/**
 * Obtiene TODOS los dispositivos registrados en el sistema (Para Administradores).
 * @param {string} [dispositivoActualId] - UUID del dispositivo actual.
 * @returns {Promise<Array>} Lista completa de dispositivos.
 */
export async function obtenerTodosLosDispositivos(dispositivoActualId = null) {
  const [rows] = await pool.query(
    `SELECT d.id, d.usuario_id, d.nombre, d.descripcion, d.estado, d.fecha_registro,
            u.nombre_completo AS propietario
     FROM dispositivos d
     JOIN usuarios u ON u.id = d.usuario_id
     ORDER BY d.fecha_registro DESC`
  );

  return rows.map((d) => ({
    ...d,
    es_actual: d.id === dispositivoActualId,
  }));
}

/**
 * Modifica el estado o los datos de un dispositivo.
 * Si esAdmin es true, permite modificar cualquier dispositivo.
 * @param {string} id - UUID del dispositivo.
 * @param {number} usuarioId - Id del usuario que solicita la modificacion.
 * @param {object} campos - Campos a actualizar ({ estado, nombre, descripcion }).
 * @param {boolean} [esAdmin=false] - Indica si el usuario es administrador.
 * @returns {Promise<boolean>} true si se actualizo el registro.
 */
export async function actualizarDispositivo(id, usuarioId, { estado, nombre, descripcion }, esAdmin = false) {
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

  if (esAdmin) {
    valores.push(id);
  } else {
    valores.push(id, usuarioId);
  }

  const sql = `UPDATE dispositivos SET ${actualizaciones.join(', ')} WHERE id = ?${
    esAdmin ? '' : ' AND usuario_id = ?'
  }`;

  const [result] = await pool.query(sql, valores);
  return result.affectedRows > 0;
}

/**
 * Elimina un dispositivo autorizado.
 * Si esAdmin es true, permite eliminar cualquier dispositivo.
 * @param {string} id - UUID del dispositivo.
 * @param {number} usuarioId - Id del usuario que solicita eliminar.
 * @param {boolean} [esAdmin=false] - Indica si el usuario es administrador.
 * @returns {Promise<boolean>} true si el registro fue eliminado.
 */
export async function eliminarDispositivo(id, usuarioId, esAdmin = false) {
  const sql = `DELETE FROM dispositivos WHERE id = ?${esAdmin ? '' : ' AND usuario_id = ?'}`;
  const valores = esAdmin ? [id] : [id, usuarioId];
  const [result] = await pool.query(sql, valores);
  return result.affectedRows > 0;
}
