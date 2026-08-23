/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: departamentos.model.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Departamentos / Carreras
Descripcion:
Acceso a datos del modulo de departamentos/carreras. Incluye el CRUD
completo sobre la tabla `departamentos` y una consulta para verificar
si un departamento tiene usuarios asociados antes de eliminarlo.
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
 * Obtiene todos los departamentos registrados.
 * @returns {Promise<Array<object>>} Lista de departamentos.
 */
async function obtenerTodos() {
  const [rows] = await pool.query(
    'SELECT id, nombre, descripcion, encargado, creado_en FROM departamentos ORDER BY nombre ASC'
  );
  return rows;
}

/**
 * Busca un departamento por su id.
 * @param {number} id - Id del departamento.
 * @returns {Promise<object|null>} El departamento encontrado o null.
 */
async function obtenerPorId(id) {
  const [rows] = await pool.query(
    'SELECT id, nombre, descripcion, encargado, creado_en FROM departamentos WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Crea un nuevo departamento.
 * @param {object} datos - Datos del departamento.
 * @param {string} datos.nombre - Nombre del departamento/carrera.
 * @param {string} [datos.descripcion] - Descripcion opcional.
 * @param {string} [datos.encargado] - Encargado opcional.
 * @returns {Promise<number>} Id del departamento creado.
 */
async function crear({ nombre, descripcion, encargado }) {
  const [result] = await pool.query(
    'INSERT INTO departamentos (nombre, descripcion, encargado) VALUES (?, ?, ?)',
    [nombre, descripcion || null, encargado || null]
  );
  return result.insertId;
}

/**
 * Actualiza los datos de un departamento existente.
 * @param {number} id - Id del departamento a modificar.
 * @param {object} datos - Nuevos datos del departamento.
 * @param {string} datos.nombre - Nombre del departamento/carrera.
 * @param {string} [datos.descripcion] - Descripcion opcional.
 * @param {string} [datos.encargado] - Encargado opcional.
 * @returns {Promise<boolean>} true si se modifico algun registro.
 */
async function actualizar(id, { nombre, descripcion, encargado }) {
  const [result] = await pool.query(
    'UPDATE departamentos SET nombre = ?, descripcion = ?, encargado = ? WHERE id = ?',
    [nombre, descripcion || null, encargado || null, id]
  );
  return result.affectedRows > 0;
}

/**
 * Elimina un departamento por su id.
 * @param {number} id - Id del departamento a eliminar.
 * @returns {Promise<boolean>} true si se elimino algun registro.
 */
async function eliminar(id) {
  const [result] = await pool.query('DELETE FROM departamentos WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Cuenta cuantos usuarios estan asociados a un departamento.
 * Se usa antes de eliminar, para no dejar informacion relacionada huerfana.
 * @param {number} id - Id del departamento.
 * @returns {Promise<number>} Cantidad de usuarios asociados.
 */
async function contarUsuariosAsociados(id) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM usuarios WHERE departamento_id = ?',
    [id]
  );
  return rows[0].total;
}

export default {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  contarUsuariosAsociados,
};
