/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: dispositivos.controller.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Dispositivos Autorizados
Descripcion:
Logica de negocio para la gestion de dispositivos autorizados.
Permite a usuarios normales gestionar sus propios dispositivos,
y a Administradores visualizar, inactivar y eliminar dispositivos de
cualquier usuario en el sistema.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { v4 as uuidv4 } from 'uuid';
import { ok, error } from '../../utils/response.js';
import { getCookieOptions } from '../../utils/session.js';
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
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function registrarDispositivo(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    const usuarioId = req.usuario.id;

    const dispositivoId = uuidv4();

    await dispositivosModel.crearDispositivo({
      id: dispositivoId,
      usuario_id: usuarioId,
      nombre,
      descripcion,
    });

    res.cookie(DEVICE_COOKIE, dispositivoId, getCookieOptions(null, ONE_YEAR_MS));

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
 * Vincula un dispositivo previamente registrado del usuario al navegador actual.
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function seleccionarDispositivo(req, res, next) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const dispositivo = await dispositivosModel.obtenerDispositivoPorId(id);
    if (!dispositivo || dispositivo.usuario_id !== usuarioId) {
      return error(res, 'Solo puede seleccionar dispositivos que pertenezcan a su propia cuenta', 403);
    }

    if (dispositivo.estado !== 'ACTIVO') {
      return error(res, 'No se puede seleccionar un dispositivo INACTIVO. Actívelo primero.', 400);
    }

    res.cookie(DEVICE_COOKIE, id, getCookieOptions(null, ONE_YEAR_MS));

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
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function listarMisDispositivos(req, res, next) {
  try {
    const dispositivoActualId = req.cookies?.[DEVICE_COOKIE] || null;
    const esAdmin = req.usuario.rol === 'administrador';

    const dispositivos = esAdmin
      ? await dispositivosModel.obtenerTodosLosDispositivos(dispositivoActualId)
      : await dispositivosModel.obtenerDispositivosPorUsuario(req.usuario.id, dispositivoActualId);

    return ok(res, dispositivos, 'Dispositivos obtenidos correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Cambia el estado (ACTIVO o INACTIVO) de un dispositivo.
 * Administradores pueden cambiar el estado de cualquier dispositivo.
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function cambiarEstadoDispositivo(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const usuarioId = req.usuario.id;
    const esAdmin = req.usuario.rol === 'administrador';

    const actualizado = await dispositivosModel.actualizarDispositivo(
      id,
      usuarioId,
      { estado: estado.toUpperCase() },
      esAdmin
    );

    if (!actualizado) {
      return error(res, 'Dispositivo no encontrado o sin permisos de modificacion', 404);
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
 * Elimina un dispositivo autorizado.
 * Administradores pueden eliminar cualquier dispositivo del sistema.
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function eliminarDispositivo(req, res, next) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const esAdmin = req.usuario.rol === 'administrador';

    const eliminado = await dispositivosModel.eliminarDispositivo(id, usuarioId, esAdmin);

    if (!eliminado) {
      return error(res, 'Dispositivo no encontrado o sin permisos de eliminacion', 404);
    }

    if (req.cookies?.[DEVICE_COOKIE] === id) {
      res.clearCookie(DEVICE_COOKIE, getCookieOptions());
    }

    return ok(res, null, 'Dispositivo eliminado correctamente');
  } catch (err) {
    next(err);
  }
}
