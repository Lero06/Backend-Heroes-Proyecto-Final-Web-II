/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: session.js
Autor: Leandro Sanchez Rojas / Adaptado a ESM por Marco Vásquez
Fecha: 22/08/2026
Modulo: Autenticacion / Sesiones
Descripcion:
Manejo de sesiones respaldado en la tabla `sesiones` de MySQL (no usa
memoria del servidor, por lo que sobrevive a reinicios y funciona
igual con varios procesos). Cualquier modulo del proyecto puede usar
estas funciones para crear, consultar o destruir una sesion.
Adaptado a ES Modules (import/export).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

export const SESSION_COOKIE = 'sid';
export const DEFAULT_MAX_AGE_MIN = Number(process.env.SESSION_MAX_AGE_MIN || 120);

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Crea una nueva sesion para un usuario autenticado y la guarda en la
 * tabla `sesiones`.
 * @param {number} usuarioId - Id del usuario que inicio sesion.
 * @param {object} req - Objeto request de Express (se usa para IP y user-agent).
 * @returns {Promise<{id: string, expiraEn: Date}>} Id de la sesion creada y su fecha de expiracion.
 */
export async function crearSesion(usuarioId, req) {
  const id = uuidv4();
  const expiraEn = new Date(Date.now() + DEFAULT_MAX_AGE_MIN * 60 * 1000);

  await pool.query(
    'INSERT INTO sesiones (id, usuario_id, ip, user_agent, expira_en) VALUES (?, ?, ?, ?, ?)',
    [id, usuarioId, req.ip, req.headers['user-agent'] || null, expiraEn]
  );

  return { id, expiraEn };
}

/**
 * Busca una sesion por su id y valida que no haya expirado.
 * Si la sesion esta expirada, la elimina automaticamente y retorna null.
 * @param {string} id - Id de la sesion (valor de la cookie `sid`).
 * @returns {Promise<object|null>} Datos de la sesion junto con el usuario y su rol, o null si no es valida.
 */
export async function obtenerSesion(id) {
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

/**
 * Elimina una sesion de la base de datos (usado en logout o cuando expira).
 * @param {string} id - Id de la sesion a destruir.
 * @returns {Promise<void>}
 */
export async function destruirSesion(id) {
  await pool.query('DELETE FROM sesiones WHERE id = ?', [id]);
}
