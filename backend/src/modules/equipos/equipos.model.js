/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: equipos.model.js
Autor: Jose Rodolfo Chaves Herrera
Fecha: 22/08/2026
Modulo: Inventario de Equipos
Descripcion:
Acceso a datos del modulo de inventario de equipos. Todas las
consultas SQL relacionadas con la tabla `equipos` viven aqui,
separadas de las rutas y el controlador, tal como pide la guia del
proyecto (acceso a datos separado, mediante el pool de conexiones).
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
 * Obtiene todos los equipos registrados, con filtro opcional por estado.
 * @param {object} [filtros] - Filtros opcionales.
 * @param {string} [filtros.estado] - Filtra por estado exacto (DISPONIBLE, PRESTADO, MANTENIMIENTO, INACTIVO).
 * @returns {Promise<Array<object>>} Lista de equipos ordenada por codigo.
 */
async function obtenerTodos({ estado } = {}) {
  const condiciones = [];
  const valores = [];

  if (estado) {
    condiciones.push('estado = ?');
    valores.push(estado);
  }

  const clausulaWhere = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT id, codigo, descripcion, imagen, estado, creado_en, actualizado_en
     FROM equipos
     ${clausulaWhere}
     ORDER BY codigo ASC`,
    valores
  );
  return rows;
}

/**
 * Busca un equipo por su id.
 * @param {number} id - Id del equipo.
 * @returns {Promise<object|null>} El equipo encontrado, o null si no existe.
 */
async function obtenerPorId(id) {
  const [rows] = await pool.query(
    'SELECT id, codigo, descripcion, imagen, estado, creado_en, actualizado_en FROM equipos WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Busca un equipo por su codigo (usado para validar unicidad).
 * @param {string} codigo - Codigo del equipo a buscar.
 * @returns {Promise<object|null>} El equipo encontrado (solo id), o null si no existe.
 */
async function obtenerPorCodigo(codigo) {
  const [rows] = await pool.query('SELECT id FROM equipos WHERE codigo = ?', [codigo]);
  return rows[0] || null;
}

/**
 * Inserta un nuevo equipo en el inventario.
 * @param {object} datos - Datos del equipo a crear.
 * @param {string} datos.codigo - Codigo unico del equipo.
 * @param {string} datos.descripcion - Descripcion del equipo.
 * @param {string|null} datos.imagen - Nombre de archivo de la imagen (o null si no se subio).
 * @param {string} datos.estado - Estado inicial del equipo.
 * @returns {Promise<number>} Id del equipo recien creado.
 */
async function crear({ codigo, descripcion, imagen, estado }) {
  const [result] = await pool.query(
    'INSERT INTO equipos (codigo, descripcion, imagen, estado) VALUES (?, ?, ?, ?)',
    [codigo, descripcion, imagen, estado]
  );
  return result.insertId;
}

/**
 * Actualiza los datos de un equipo existente.
 * Solo actualiza la imagen si se provee una nueva (imagen !== undefined),
 * para no borrar la imagen actual cuando el formulario se envia sin archivo.
 * @param {number} id - Id del equipo a actualizar.
 * @param {object} datos - Campos a actualizar.
 * @param {string} datos.codigo - Codigo del equipo.
 * @param {string} datos.descripcion - Descripcion del equipo.
 * @param {string} datos.estado - Estado del equipo.
 * @param {string} [datos.imagen] - Nuevo nombre de archivo de imagen, si se subio una.
 * @returns {Promise<boolean>} true si se modifico algun registro.
 */
async function actualizar(id, { codigo, descripcion, estado, imagen }) {
  if (imagen !== undefined) {
    const [result] = await pool.query(
      'UPDATE equipos SET codigo = ?, descripcion = ?, estado = ?, imagen = ? WHERE id = ?',
      [codigo, descripcion, estado, imagen, id]
    );
    return result.affectedRows > 0;
  }

  const [result] = await pool.query(
    'UPDATE equipos SET codigo = ?, descripcion = ?, estado = ? WHERE id = ?',
    [codigo, descripcion, estado, id]
  );
  return result.affectedRows > 0;
}

/**
 * Actualiza unicamente el estado de un equipo (usado por otros modulos,
 * como Prestamos, para marcar PRESTADO/DISPONIBLE automaticamente).
 * @param {number} id - Id del equipo.
 * @param {string} estado - Nuevo estado.
 * @returns {Promise<boolean>} true si se modifico algun registro.
 */
async function actualizarEstado(id, estado) {
  const [result] = await pool.query('UPDATE equipos SET estado = ? WHERE id = ?', [estado, id]);
  return result.affectedRows > 0;
}

/**
 * Elimina un equipo del inventario.
 * @param {number} id - Id del equipo a eliminar.
 * @returns {Promise<boolean>} true si se elimino algun registro.
 */
async function eliminar(id) {
  const [result] = await pool.query('DELETE FROM equipos WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export default {
  obtenerTodos,
  obtenerPorId,
  obtenerPorCodigo,
  crear,
  actualizar,
  actualizarEstado,
  eliminar,
};
