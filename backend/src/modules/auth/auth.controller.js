/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: auth.controller.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Autenticacion y Usuarios
Descripcion:
Logica de negocio del modulo de autenticacion: registro, login,
logout, y recuperacion/restablecimiento de contrasena por token.
Recibe las peticiones desde auth.routes.js, usa auth.model.js para
el acceso a datos y utils/session.js para crear/destruir la sesion.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ok, error } from '../../utils/response.js';
import { crearSesion, destruirSesion, SESSION_COOKIE, getCookieOptions } from '../../utils/session.js';
import { enviarCorreoRecuperacion } from '../../utils/mailer.js';
import authModel from './auth.model.js';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const SALT_ROUNDS = 10;
const ROL_POR_DEFECTO = 'usuario';
const RECUPERACION_TOKEN_MIN = Number(process.env.RECUPERACION_TOKEN_MIN || 30);

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Registra un nuevo usuario en el sistema.
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware.
 */
export async function registrar(req, res, next) {
  try {
    const {
      nombre_completo,
      fecha_nacimiento,
      correo,
      departamento_id,
      usuario,
      password,
      confirmar_password,
    } = req.body;

    if (password !== confirmar_password) {
      return error(res, 'La contrasena y su confirmacion no coinciden', 400);
    }

    const [correoExistente, usuarioExistente] = await Promise.all([
      authModel.buscarPorCorreo(correo),
      authModel.buscarPorUsuario(usuario),
    ]);

    if (correoExistente) return error(res, 'El correo ya esta registrado', 409);
    if (usuarioExistente) return error(res, 'El nombre de usuario ya esta registrado', 409);

    const rolId = await authModel.obtenerRolIdPorNombre(ROL_POR_DEFECTO);
    if (!rolId) return error(res, 'No se encontro el rol por defecto en la base de datos', 500);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const nuevoId = await authModel.crearUsuario({
      nombre_completo,
      fecha_nacimiento,
      correo,
      usuario,
      password_hash: passwordHash,
      departamento_id,
      rol_id: rolId,
    });

    return ok(res, { id: nuevoId, usuario, correo }, 'Usuario registrado correctamente', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Inicia sesion de un usuario existente y establece la cookie sid.
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware.
 */
export async function login(req, res, next) {
  try {
    const { identificador, password } = req.body;

    const usuario = await authModel.buscarParaLogin(identificador);

    if (!usuario) return error(res, 'Credenciales invalidas', 401);
    if (!usuario.activo) return error(res, 'La cuenta se encuentra inactiva', 403);

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) return error(res, 'Credenciales invalidas', 401);

    const { id: sessionId, expiraEn } = await crearSesion(usuario.id, req);

    res.cookie(SESSION_COOKIE, sessionId, getCookieOptions(expiraEn));

    return ok(
      res,
      { id: usuario.id, usuario: usuario.usuario, correo: usuario.correo, rol: usuario.rol },
      'Inicio de sesion exitoso'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Cierra la sesion activa del usuario.
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware.
 */
export async function logout(req, res, next) {
  try {
    const sid = req.cookies?.[SESSION_COOKIE];

    if (sid) {
      await destruirSesion(sid);
    }

    res.clearCookie(SESSION_COOKIE, getCookieOptions());

    return ok(res, null, 'Sesion cerrada correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Solicita la recuperacion de contrasena.
 */
export async function recuperarPassword(req, res, next) {
  try {
    const { identificador } = req.body;
    const usuario = await authModel.buscarPorIdentificador(identificador);
    const mensajeGenerico =
      'Si el usuario existe, se genero un enlace de recuperacion valido por ' +
      `${RECUPERACION_TOKEN_MIN} minutos`;

    if (!usuario || !usuario.activo) {
      return ok(res, null, mensajeGenerico);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEn = new Date(Date.now() + RECUPERACION_TOKEN_MIN * 60 * 1000);

    await authModel.crearTokenRecuperacion(usuario.id, token, expiraEn);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlace = `${frontendUrl}/restablecer-password?token=${token}`;

    // Enviar el correo real con Mailtrap/Nodemailer.
    // Si falla el envio se lanza una excepcion que captura el middleware de errores.
    await enviarCorreoRecuperacion(usuario.correo, usuario.usuario, enlace);

    return ok(res, null, mensajeGenerico);
  } catch (err) {
    next(err);
  }
}

/**
 * Restablece la contrasena con token.
 */
export async function restablecerPassword(req, res, next) {
  try {
    const { token, password_nueva, confirmar_password_nueva } = req.body;

    if (password_nueva !== confirmar_password_nueva) {
      return error(res, 'La nueva contrasena y su confirmacion no coinciden', 400);
    }

    const registroToken = await authModel.buscarTokenRecuperacion(token);

    if (!registroToken) return error(res, 'El token de recuperacion no es valido', 400);
    if (registroToken.usado) return error(res, 'Este token ya fue utilizado', 400);
    if (new Date(registroToken.expira_en) < new Date()) {
      return error(res, 'El token de recuperacion ha expirado', 400);
    }

    const nuevoHash = await bcrypt.hash(password_nueva, SALT_ROUNDS);

    await authModel.actualizarPasswordUsuario(registroToken.usuario_id, nuevoHash);
    await authModel.marcarTokenUsado(registroToken.id);

    return ok(res, null, 'Contrasena restablecida correctamente');
  } catch (err) {
    next(err);
  }
}
