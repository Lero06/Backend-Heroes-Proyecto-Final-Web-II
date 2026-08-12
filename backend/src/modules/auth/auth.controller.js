/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: auth.controller.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Autenticacion y Usuarios
Descripcion:
Logica de negocio del modulo de autenticacion: registro de usuarios,
inicio y cierre de sesion. Recibe las peticiones desde auth.routes.js,
usa auth.model.js para el acceso a datos y utils/session.js para
crear/destruir la sesion del usuario.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

const bcrypt = require('bcryptjs');
const { ok, error } = require('../../utils/response');
const { crearSesion, destruirSesion, SESSION_COOKIE } = require('../../utils/session');
const authModel = require('./auth.model');

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const SALT_ROUNDS = 10;
const ROL_POR_DEFECTO = 'usuario';

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
async function registrar(req, res, next) {
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
async function login(req, res, next) {
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
async function logout(req, res, next) {
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

module.exports = { registrar, login, logout };
