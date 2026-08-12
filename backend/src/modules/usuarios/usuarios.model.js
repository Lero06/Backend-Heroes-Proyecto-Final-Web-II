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

const pool = require('../../config/db');

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
async function obtenerPerfilPorId(id) {
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
async function actualizarPerfil(id, { nombre_completo, fecha_nacimiento, departamento_id }) {
  const [result] = await pool.query(
    `UPDATE usuarios
     SET nombre_completo = ?, fecha_nacimiento = ?, departamento_id = ?
     WHERE id = ?`,
    [nombre_completo, fecha_nacimiento, departamento_id, id]
  );
  return result.affectedRows > 0;
}

module.exports = { obtenerPerfilPorId, actualizarPerfil };
