/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: dispositivos.controller.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Dispositivos Autorizados
Descripcion:
Logica de negocio para la gestion de dispositivos autorizados de los
usuarios. Permite registrar un dispositivo, seleccionar que dispositivo
usar en el navegador actual (asignando cookie HTTP-Only `dispositivo_id`),
listar dispositivos, cambiar su estado (ACTIVO/INACTIVO) y eliminarlos.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { v4 as uuidv4 } from 'uuid';
import { ok, error } from '../../utils/response.js';
import * as dispositivosModel from './dispositivos.model.js';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const DEVICE_COOKIE = 'dispositivo_id';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Registra el dispositivo actual para el usuario autenticado.
 * Genera un identificador unico (UUID), guarda el registro en la base de datos
 * y establece una cookie HTTP-Only `dispositivo_id` en la respuesta.
 * @param {object} req - Request de Express (req.usuario.id, req.body).
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function registrarDispositivo(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    const usuarioId = req.usuario.id;

    // Generar UUID unico para identificar este dispositivo/navegador
    const dispositivoId = uuidv4();

    await dispositivosModel.crearDispositivo({
      id: dispositivoId,
      usuario_id: usuarioId,
      nombre,
      descripcion,
    });

    // Establecer la cookie HTTP-Only duradera con el identificador del dispositivo
    res.cookie(DEVICE_COOKIE, dispositivoId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ONE_YEAR_MS,
    });

    const nuevoDispositivo = await dispositivosModel.obtenerDispositivoPorId(dispositivoId);

    return ok(
      res,
      nuevoDispositivo,
      'Dispositivo registrado y autorizado correctamente en este navegador',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Vincula un dispositivo previamente registrado al navegador actual
 * actualizando la cookie HTTP-Only `dispositivo_id`.
 * @param {object} req - Request de Express (req.params.id, req.usuario.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function seleccionarDispositivo(req, res, next) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const dispositivo = await dispositivosModel.obtenerDispositivoPorId(id);
    if (!dispositivo || dispositivo.usuario_id !== usuarioId) {
      return error(res, 'Dispositivo no encontrado o no pertenece a este usuario', 404);
    }

    if (dispositivo.estado !== 'ACTIVO') {
      return error(res, 'No se puede seleccionar un dispositivo INACTIVO. Actívelo primero.', 400);
    }

    // Asignar cookie al dispositivo elegido
    res.cookie(DEVICE_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ONE_YEAR_MS,
    });

    return ok(res, dispositivo, `El navegador ahora está utilizando el dispositivo "${dispositivo.nombre}"`);
  } catch (err) {
    next(err);
  }
}

/**
 * Desvincula cualquier dispositivo del navegador actual limpiando la cookie DEVICE_COOKIE.
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function deseleccionarDispositivo(req, res, next) {
  try {
    res.clearCookie(DEVICE_COOKIE);
    return ok(res, null, 'Dispositivo deseleccionado en este navegador');
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene la lista de todos los dispositivos autorizados del usuario autenticado,
 * identificando cuál es el que está activo en el navegador actual.
 * @param {object} req - Request de Express (req.usuario.id, req.cookies).
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function listarMisDispositivos(req, res, next) {
  try {
    const dispositivoActualId = req.cookies?.[DEVICE_COOKIE] || null;
    const dispositivos = await dispositivosModel.obtenerDispositivosPorUsuario(
      req.usuario.id,
      dispositivoActualId
    );
    return ok(res, dispositivos, 'Dispositivos obtenidos correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Cambia el estado (ACTIVO o INACTIVO) de un dispositivo perteneciente al usuario.
 * @param {object} req - Request de Express (req.params.id, req.body.estado, req.usuario.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function cambiarEstadoDispositivo(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const usuarioId = req.usuario.id;

    const actualizado = await dispositivosModel.actualizarDispositivo(id, usuarioId, {
      estado: estado.toUpperCase(),
    });

    if (!actualizado) {
      return error(res, 'Dispositivo no encontrado o no pertenece a este usuario', 404);
    }

    const dispositivoActualizado = await dispositivosModel.obtenerDispositivoPorId(id);

    return ok(
      res,
      dispositivoActualizado,
      `Estado del dispositivo actualizado a ${estado.toUpperCase()}`
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Elimina un dispositivo autorizado de un usuario.
 * @param {object} req - Request de Express (req.params.id, req.usuario.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function eliminarDispositivo(req, res, next) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const eliminado = await dispositivosModel.eliminarDispositivo(id, usuarioId);

    if (!eliminado) {
      return error(res, 'Dispositivo no encontrado o no pertenece a este usuario', 404);
    }

    // Si el dispositivo eliminado coincide con el de la cookie actual, la limpiamos
    if (req.cookies?.[DEVICE_COOKIE] === id) {
      res.clearCookie(DEVICE_COOKIE);
    }

    return ok(res, null, 'Dispositivo eliminado correctamente');
  } catch (err) {
    next(err);
  }
}
