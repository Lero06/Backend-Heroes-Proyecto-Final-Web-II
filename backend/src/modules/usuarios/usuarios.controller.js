/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: usuarios.controller.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Usuarios (Perfil)
Descripcion:
Logica de negocio para ver y editar el perfil del usuario autenticado.
Ambos endpoints requieren sesion activa (ver usuarios.routes.js) y
operan siempre sobre req.usuario.id, nunca sobre un id recibido por
parametro, para que un usuario no pueda editar el perfil de otro.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

const { ok, error } = require('../../utils/response');
const usuariosModel = require('./usuarios.model');

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

module.exports = { verPerfil, actualizarPerfil };
