/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: usuarios.controller.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Usuarios (Perfil)
Descripcion:
Logica de negocio para ver/editar el perfil y cambiar la contrasena
del usuario autenticado. Todos los endpoints requieren sesion activa
(ver usuarios.routes.js) y operan siempre sobre req.usuario.id, nunca
sobre un id recibido por parametro, para que un usuario no pueda
modificar los datos de otro.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

const bcrypt = require('bcryptjs');
const { ok, error } = require('../../utils/response');
const usuariosModel = require('./usuarios.model');

const SALT_ROUNDS = 10;

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Obtiene el perfil del usuario actualmente autenticado.
 * @param {object} req - Request de Express (usa req.usuario.id, agregado por verificarSesion).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con los datos del perfil.
 */
async function verPerfil(req, res, next) {
  try {
    const perfil = await usuariosModel.obtenerPerfilPorId(req.usuario.id);

    if (!perfil) return error(res, 'Usuario no encontrado', 404);

    return ok(res, perfil, 'Perfil obtenido correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Actualiza el perfil del usuario autenticado.
 * Solo permite modificar nombre, fecha de nacimiento y departamento;
 * correo y nombre de usuario quedan fuera de este endpoint a proposito.
 * @param {object} req - Request de Express (req.usuario.id y req.body).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP confirmando la actualizacion.
 */
async function actualizarPerfil(req, res, next) {
  try {
    const { nombre_completo, fecha_nacimiento, departamento_id } = req.body;

    await usuariosModel.actualizarPerfil(req.usuario.id, {
      nombre_completo,
      fecha_nacimiento,
      departamento_id,
    });

    const perfilActualizado = await usuariosModel.obtenerPerfilPorId(req.usuario.id);

    return ok(res, perfilActualizado, 'Perfil actualizado correctamente');
  } catch (err) {
    // El departamento_id no existe: MySQL rechaza la llave foranea
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return error(res, 'El departamento indicado no existe', 400);
    }
    next(err);
  }
}

module.exports = { verPerfil, actualizarPerfil, cambiarPassword };

/**
 * Cambia la contrasena del usuario autenticado.
 * Requiere la contrasena actual (se valida contra el hash guardado
 * antes de aplicar el cambio) y la confirmacion de la nueva.
 * @param {object} req - Request de Express (req.usuario.id y req.body).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP confirmando el cambio.
 */
async function cambiarPassword(req, res, next) {
  try {
    const { password_actual, password_nueva, confirmar_password_nueva } = req.body;

    if (password_nueva !== confirmar_password_nueva) {
      return error(res, 'La nueva contrasena y su confirmacion no coinciden', 400);
    }

    const hashActual = await usuariosModel.obtenerPasswordHashPorId(req.usuario.id);
    if (!hashActual) return error(res, 'Usuario no encontrado', 404);

    const passwordActualValida = await bcrypt.compare(password_actual, hashActual);
    if (!passwordActualValida) return error(res, 'La contrasena actual es incorrecta', 401);

    if (password_actual === password_nueva) {
      return error(res, 'La nueva contrasena debe ser diferente a la actual', 400);
    }

    const nuevoHash = await bcrypt.hash(password_nueva, SALT_ROUNDS);
    await usuariosModel.actualizarPassword(req.usuario.id, nuevoHash);

    return ok(res, null, 'Contrasena actualizada correctamente');
  } catch (err) {
    next(err);
  }
}
