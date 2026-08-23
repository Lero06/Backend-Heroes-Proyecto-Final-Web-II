/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: usuarios.model.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Usuarios (Perfil)
Descripcion:
Acceso a datos para el perfil del usuario autenticado: obtener sus
datos (sin el hash de la contrasena) y actualizar nombre, fecha de
nacimiento y departamento.
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
 * Obtiene los datos publicos del perfil de un usuario (sin password_hash).
 * @param {number} id - Id del usuario.
 * @returns {Promise<object|null>} Datos del perfil o null si no existe.
 */
export async function obtenerPerfilPorId(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre_completo, u.fecha_nacimiento, u.correo, u.usuario,
            u.departamento_id, d.nombre AS departamento, r.nombre AS rol,
            u.creado_en, u.actualizado_en
     FROM usuarios u
     LEFT JOIN departamentos d ON d.id = u.departamento_id
     JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Actualiza los campos editables del perfil de un usuario.
 * Correo y nombre de usuario no se tocan aqui, tal como pide la guia.
 * @param {number} id - Id del usuario a actualizar.
 * @param {object} datos - Nuevos datos del perfil.
 * @param {string} datos.nombre_completo - Nombre completo actualizado.
 * @param {string} datos.fecha_nacimiento - Fecha de nacimiento (YYYY-MM-DD).
 * @param {number} datos.departamento_id - Id del nuevo departamento.
 * @returns {Promise<boolean>} true si se modifico algun registro.
 */
export async function actualizarPerfil(id, { nombre_completo, fecha_nacimiento, departamento_id }) {
  const [result] = await pool.query(
    `UPDATE usuarios
     SET nombre_completo = ?, fecha_nacimiento = ?, departamento_id = ?
     WHERE id = ?`,
    [nombre_completo, fecha_nacimiento, departamento_id, id]
  );
  return result.affectedRows > 0;
}

/**
 * Obtiene el hash de contrasena actual de un usuario (para validar el
 * cambio de contrasena).
 * @param {number} id - Id del usuario.
 * @returns {Promise<string|null>} El password_hash almacenado, o null si no existe.
 */
export async function obtenerPasswordHashPorId(id) {
  const [rows] = await pool.query('SELECT password_hash FROM usuarios WHERE id = ?', [id]);
  return rows[0]?.password_hash || null;
}

/**
 * Actualiza el hash de contrasena de un usuario.
 * @param {number} id - Id del usuario.
 * @param {string} passwordHash - Nuevo hash generado con bcrypt.
 * @returns {Promise<boolean>} true si se modifico algun registro.
 */
export async function actualizarPassword(id, passwordHash) {
  const [result] = await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [
    passwordHash,
    id,
  ]);
  return result.affectedRows > 0;
}

export default {
  obtenerPerfilPorId,
  actualizarPerfil,
  obtenerPasswordHashPorId,
  actualizarPassword,
};
