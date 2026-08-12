/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: auth.model.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Autenticacion y Usuarios
Descripcion:
Acceso a datos del modulo de autenticacion. Todas las consultas SQL
relacionadas con usuarios y roles para login/registro viven aqui,
separadas de las rutas y el controlador, tal como pide la guia del
proyecto (acceso a datos separado, mediante el pool de conexiones).
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
 * Busca un usuario por su correo electronico.
 * @param {string} correo - Correo a buscar.
 * @returns {Promise<object|null>} El usuario encontrado (solo id) o null.
 */
async function buscarPorCorreo(correo) {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
  return rows[0] || null;
}

/**
 * Busca un usuario por su nombre de usuario.
 * @param {string} usuario - Nombre de usuario a buscar.
 * @returns {Promise<object|null>} El usuario encontrado (solo id) o null.
 */
async function buscarPorUsuario(usuario) {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
  return rows[0] || null;
}

/**
 * Busca un usuario por usuario o correo para el proceso de login,
 * incluyendo el hash de la contrasena y el nombre de su rol.
 * @param {string} identificador - Usuario o correo ingresado en el login.
 * @returns {Promise<object|null>} Usuario con password_hash y rol, o null si no existe.
 */
async function buscarParaLogin(identificador) {
  const [rows] = await pool.query(
    `SELECT u.id, u.usuario, u.correo, u.password_hash, u.rol_id, u.activo, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.usuario = ? OR u.correo = ?
     LIMIT 1`,
    [identificador, identificador]
  );
  return rows[0] || null;
}

/**
 * Obtiene el id de un rol a partir de su nombre (ej. 'usuario', 'administrador').
 * @param {string} nombre - Nombre del rol.
 * @returns {Promise<number|null>} Id del rol, o null si no existe.
 */
async function obtenerRolIdPorNombre(nombre) {
  const [rows] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [nombre]);
  return rows[0]?.id || null;
}

/**
 * Inserta un nuevo usuario en la base de datos.
 * @param {object} datos - Datos del usuario a crear.
 * @param {string} datos.nombre_completo - Nombre completo del usuario.
 * @param {string} datos.fecha_nacimiento - Fecha de nacimiento (YYYY-MM-DD).
 * @param {string} datos.correo - Correo electronico (unico).
 * @param {string} datos.usuario - Nombre de usuario (unico).
 * @param {string} datos.password_hash - Contrasena ya hasheada con bcrypt.
 * @param {number} datos.departamento_id - Id del departamento/carrera.
 * @param {number} datos.rol_id - Id del rol asignado por defecto.
 * @returns {Promise<number>} Id del usuario recien creado.
 */
async function crearUsuario({
  nombre_completo,
  fecha_nacimiento,
  correo,
  usuario,
  password_hash,
  departamento_id,
  rol_id,
}) {
  const [result] = await pool.query(
    `INSERT INTO usuarios
       (nombre_completo, fecha_nacimiento, correo, usuario, password_hash, departamento_id, rol_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nombre_completo, fecha_nacimiento, correo, usuario, password_hash, departamento_id, rol_id]
  );
  return result.insertId;
}

module.exports = {
  buscarPorCorreo,
  buscarPorUsuario,
  buscarParaLogin,
  obtenerRolIdPorNombre,
  crearUsuario,
};
