// Manejo de sesiones respaldado en la tabla `sesiones` (no usa memoria del
// servidor, así que sobrevive a reinicios y funciona igual en varios
// procesos). Cualquier módulo puede usar estas funciones.

const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

const SESSION_COOKIE = 'sid';
const DEFAULT_MAX_AGE_MIN = Number(process.env.SESSION_MAX_AGE_MIN || 120);

async function crearSesion(usuarioId, req) {
  const id = uuidv4();
  const expiraEn = new Date(Date.now() + DEFAULT_MAX_AGE_MIN * 60 * 1000);

  await pool.query(
    'INSERT INTO sesiones (id, usuario_id, ip, user_agent, expira_en) VALUES (?, ?, ?, ?, ?)',
    [id, usuarioId, req.ip, req.headers['user-agent'] || null, expiraEn]
  );

  return { id, expiraEn };
}

async function obtenerSesion(id) {
  const [rows] = await pool.query(
    `SELECT s.id, s.usuario_id, s.expira_en,
            u.usuario, u.correo, u.rol_id, r.nombre AS rol
     FROM sesiones s
     JOIN usuarios u ON u.id = s.usuario_id
     JOIN roles r ON r.id = u.rol_id
     WHERE s.id = ?`,
    [id]
  );

  if (rows.length === 0) return null;

  const sesion = rows[0];
  if (new Date(sesion.expira_en) < new Date()) {
    await destruirSesion(id);
    return null;
  }

  return sesion;
}

async function destruirSesion(id) {
  await pool.query('DELETE FROM sesiones WHERE id = ?', [id]);
}

module.exports = {
  crearSesion,
  obtenerSesion,
  destruirSesion,
  SESSION_COOKIE,
  DEFAULT_MAX_AGE_MIN,
};
