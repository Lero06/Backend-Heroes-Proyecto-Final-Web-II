// Acceso a datos del modulo de autenticacion. Todas las consultas SQL
// del modulo viven aqui, separadas de las rutas y el controlador.

const pool = require('../../config/db');

async function buscarPorCorreo(correo) {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
  return rows[0] || null;
}

async function buscarPorUsuario(usuario) {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
  return rows[0] || null;
}

async function obtenerRolIdPorNombre(nombre) {
  const [rows] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [nombre]);
  return rows[0]?.id || null;
}

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
  obtenerRolIdPorNombre,
  crearUsuario,
};
