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
import { crearSesion, destruirSesion, SESSION_COOKIE } from '../../utils/session.js';
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
 * Valida que la contrasena y su confirmacion coincidan, que el correo
 * y el usuario no esten duplicados, y guarda la contrasena hasheada
 * con bcrypt (nunca en texto plano).
 * @param {object} req - Request de Express (req.body con los datos del formulario).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el usuario creado (sin la contrasena).
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

    // Regla de negocio: confirmacion de contrasena (no lo cubre el
    // validate.middleware porque compara dos campos entre si)
    if (password !== confirmar_password) {
      return error(res, 'La contrasena y su confirmacion no coinciden', 400);
    }

    // Regla de negocio: correo y usuario unicos (requiere consultar la BD)
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

    // Nunca se devuelve el password_hash en la respuesta
    return ok(res, { id: nuevoId, usuario, correo }, 'Usuario registrado correctamente', 201);
  } catch (err) {
    next(err); // lo captura error.middleware.js
  }
}

/**
 * Inicia sesion de un usuario existente.
 * Acepta usuario o correo como identificador. Si las credenciales son
 * validas, crea una sesion en la tabla `sesiones` y la entrega al
 * cliente como cookie HttpOnly.
 * @param {object} req - Request de Express (req.body con identificador y password).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con los datos basicos del usuario autenticado.
 */
export async function login(req, res, next) {
  try {
    const { identificador, password } = req.body; // usuario o correo

    const usuario = await authModel.buscarParaLogin(identificador);

    // Mensaje generico: no revela si fallo el usuario o la contrasena
    if (!usuario) return error(res, 'Credenciales invalidas', 401);
    if (!usuario.activo) return error(res, 'La cuenta se encuentra inactiva', 403);

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) return error(res, 'Credenciales invalidas', 401);

    const { id: sessionId, expiraEn } = await crearSesion(usuario.id, req);

    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: expiraEn,
    });

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
 * Elimina la sesion de la base de datos y limpia la cookie en el
 * cliente, dejandolo sin acceso a las rutas protegidas.
 * @param {object} req - Request de Express (requiere pasar por verificarSesion antes).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP confirmando el cierre de sesion.
 */
export async function logout(req, res, next) {
  try {
    const sid = req.cookies?.[SESSION_COOKIE];

    if (sid) {
      await destruirSesion(sid);
    }

    res.clearCookie(SESSION_COOKIE);

    return ok(res, null, 'Sesion cerrada correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Solicita la recuperacion de contrasena. Genera un token temporal de
 * un solo uso y lo guarda en tokens_recuperacion. Por seguridad,
 * responde el mismo mensaje exista o no el usuario, para no revelar
 * si un correo/usuario esta registrado en el sistema.
 * @param {object} req - Request de Express (req.body.identificador: usuario o correo).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP generica de confirmacion.
 */
export async function recuperarPassword(req, res, next) {
  try {
    const { identificador } = req.body;

    const usuario = await authModel.buscarPorIdentificador(identificador);

    // No revelar si el usuario existe o no (mismo mensaje en ambos casos)
    const mensajeGenerico =
      'Si el usuario existe, se genero un enlace de recuperacion valido por ' +
      `${RECUPERACION_TOKEN_MIN} minutos`;

    if (!usuario || !usuario.activo) {
      return ok(res, null, mensajeGenerico);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEn = new Date(Date.now() + RECUPERACION_TOKEN_MIN * 60 * 1000);

    await authModel.crearTokenRecuperacion(usuario.id, token, expiraEn);

    // NOTA: aqui se conectaria el envio real por correo (ej. Nodemailer).
    // Mientras tanto, se devuelve el enlace en la respuesta para poder
    // probar el flujo completo desde Postman/Thunder Client.
    const enlace = `http://localhost:5173/restablecer-password?token=${token}`;

    return ok(res, { enlace }, mensajeGenerico);
  } catch (err) {
    next(err);
  }
}

/**
 * Restablece la contrasena usando un token de recuperacion valido.
 * El token debe existir, no estar usado y no haber expirado. Al
 * usarse correctamente, se marca como usado para que no pueda
 * reutilizarse (regla de "un solo uso" exigida por la guia).
 * @param {object} req - Request de Express (req.body: token, password_nueva, confirmar_password_nueva).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP confirmando el restablecimiento.
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
