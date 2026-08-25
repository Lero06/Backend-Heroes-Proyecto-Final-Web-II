/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: session.js
Autor: Leandro Sanchez Rojas / Adaptado a ESM por Marco Vásquez / Actualizado por Jose Rodolfo Chaves Herrera
Fecha: 25/08/2026
Modulo: Autenticacion / Sesiones
Descripcion:
Manejo de sesiones respaldado en la tabla `sesiones` de MySQL y
configuracion dinamica de expiracion segun la tabla `configuracion`
(clave `tiempo_max_sesion_min`).
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
FUNCIONES DE CONFIGURACION DINAMICA
//////////////////////////////////////////////////////////
*/

/**
 * Obtiene el tiempo maximo de sesion en minutos configurado en la base de datos.
 * @returns {Promise<number>} Tiempo en minutos.
 */
export async function obtenerTiempoMaxSesionMin() {
  try {
    const [rows] = await pool.query(
      "SELECT valor FROM configuracion WHERE clave = 'tiempo_max_sesion_min'"
    );
    if (rows.length > 0 && rows[0].valor) {
      const val = Number(rows[0].valor);
      if (!isNaN(val) && val > 0) return val;
    }
  } catch (err) {
    // Si falla la consulta, recurrir a variable de entorno o default
  }
  return DEFAULT_MAX_AGE_MIN;
}

/*
//////////////////////////////////////////////////////////
UTILIDAD DE OPCIONES DE COOKIE
//////////////////////////////////////////////////////////
*/

/**
 * Genera las opciones de cookie infalibles:
 * - maxAge garantizado en milisegundos (evita problemas de reloj/zona horaria).
 * - En produccion (HTTPS Vercel/Railway): secure: true, sameSite: 'none'
 * - En desarrollo local (localhost / Wi-Fi LAN): secure: false
 * @param {Date|null} [expiraEn] - Fecha de expiracion opcional.
 * @param {number|null} [maxAgeMs] - Tiempo maximo de vida en ms opcional.
 * @returns {object} Objeto de configuracion para res.cookie.
 */
export function getCookieOptions(expiraEn = null, maxAgeMs = null) {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RAILWAY_ENVIRONMENT);

  const options = {
    path: '/',
    httpOnly: true,
  };

  if (isProd) {
    options.secure = true;
    options.sameSite = 'none';
  } else {
    options.secure = false;
  }

  // maxAge en milisegundos es inmune a desajustes de zona horaria o reloj del sistema
  if (maxAgeMs) {
    options.maxAge = maxAgeMs;
  } else if (expiraEn instanceof Date) {
    const msRestantes = expiraEn.getTime() - Date.now();
    options.expires = expiraEn;
    options.maxAge = msRestantes > 0 ? msRestantes : DEFAULT_MAX_AGE_MIN * 60 * 1000;
  } else {
    options.maxAge = DEFAULT_MAX_AGE_MIN * 60 * 1000;
  }

  return options;
}

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Crea una nueva sesion para un usuario autenticado y la guarda en la tabla `sesiones`.
 * La duracion se toma dinamicamente de la tabla `configuracion`.
 * @param {number} usuarioId - Id del usuario que inicio sesion.
 * @param {object} req - Objeto request de Express.
 * @returns {Promise<{id: string, expiraEn: Date}>} Id de la sesion creada y expiracion.
 */
export async function crearSesion(usuarioId, req) {
  const id = uuidv4();
  const maxAgeMin = await obtenerTiempoMaxSesionMin();
  const expiraEn = new Date(Date.now() + maxAgeMin * 60 * 1000);

  await pool.query(
    'INSERT INTO sesiones (id, usuario_id, ip, user_agent, expira_en) VALUES (?, ?, ?, ?, ?)',
    [id, usuarioId, req.ip, req.headers['user-agent'] || null, expiraEn]
  );

  return { id, expiraEn };
}

/**
 * Busca una sesion por su id y valida que no haya expirado.
 * @param {string} id - Id de la sesion.
 * @returns {Promise<object|null>} Datos de la sesion o null.
 */
export async function obtenerSesion(id) {
  const [rows] = await pool.query(
    `SELECT s.id, s.usuario_id, s.expira_en,
            u.nombre_completo, u.usuario, u.correo, u.rol_id, r.nombre AS rol
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
 * Elimina una sesion de la base de datos.
 * @param {string} id - Id de la sesion a destruir.
 * @returns {Promise<void>}
 */
export async function destruirSesion(id) {
  await pool.query('DELETE FROM sesiones WHERE id = ?', [id]);
}
