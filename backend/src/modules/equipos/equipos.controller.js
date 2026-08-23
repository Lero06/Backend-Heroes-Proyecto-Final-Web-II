/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: equipos.controller.js
Autor: Jose Rodolfo Chaves Herrera
Fecha: 22/08/2026
Modulo: Inventario de Equipos
Descripcion:
Logica de negocio del modulo de inventario de equipos: listar,
consultar, crear, actualizar, cambiar estado y eliminar equipos, con
manejo de la imagen asociada (subida via middleware de Multer en
equipos.routes.js, disponible aqui como req.file).
Reglas de negocio propias de este modulo:
- El codigo de equipo debe ser unico (se valida contra la BD, no solo
  con el formato del campo).
- El estado PRESTADO no se puede asignar manualmente desde este CRUD:
  ese cambio de estado es responsabilidad exclusiva del modulo de
  Prestamos (Integrante 5), para no duplicar la logica de negocio del
  prestamo/devolucion en dos lugares distintos.
- Al reemplazar o borrar un equipo, se elimina del disco el archivo de
  imagen anterior para no dejar archivos huerfanos en uploads/equipos.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import fs from 'fs';
import path from 'path';
import { ok, error } from '../../utils/response.js';
import equiposModel from './equipos.model.js';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const ESTADO_INICIAL_POR_DEFECTO = 'DISPONIBLE';
const ESTADOS_PERMITIDOS_MANUALMENTE = ['DISPONIBLE', 'MANTENIMIENTO', 'INACTIVO'];
const CARPETA_UPLOADS_EQUIPOS = path.resolve(process.cwd(), 'uploads', 'equipos');

/*
//////////////////////////////////////////////////////////
FUNCION AUXILIAR PRIVADA
//////////////////////////////////////////////////////////
*/

/**
 * Elimina del disco un archivo de imagen de equipos, si existe.
 * No lanza error si el archivo ya no existe (borrado manual, etc.):
 * ese caso se ignora silenciosamente porque el resultado deseado
 * (que el archivo no este) ya se cumple.
 * @param {string|null|undefined} nombreArchivo - Nombre del archivo a borrar.
 */
function borrarImagenSiExiste(nombreArchivo) {
  if (!nombreArchivo) return;

  const rutaCompleta = path.join(CARPETA_UPLOADS_EQUIPOS, nombreArchivo);
  fs.unlink(rutaCompleta, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('No se pudo eliminar la imagen anterior del equipo:', err.message);
    }
  });
}

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Lista los equipos del inventario, con filtro opcional por estado.
 * Disponible para cualquier usuario autenticado (no solo administradores),
 * ya que tanto el catalogo de equipos como el modulo de prestamos
 * necesitan poder consultar el inventario disponible.
 * @param {object} req - Request de Express (query.estado opcional).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el listado de equipos.
 */
async function listar(req, res, next) {
  try {
    const { estado } = req.query;
    const equipos = await equiposModel.obtenerTodos({ estado });
    return ok(res, equipos, 'Equipos obtenidos correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene el detalle de un equipo por su id.
 * @param {object} req - Request de Express (params.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el equipo encontrado.
 */
async function obtenerUno(req, res, next) {
  try {
    const equipo = await equiposModel.obtenerPorId(req.params.id);
    if (!equipo) return error(res, 'Equipo no encontrado', 404);

    return ok(res, equipo, 'Equipo obtenido correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Registra un nuevo equipo en el inventario.
 * La imagen es opcional al crear (puede agregarse despues con
 * actualizar); si se envia, ya fue guardada en disco por el
 * middleware de subida y esta disponible en req.file.
 * @param {object} req - Request de Express (req.body: codigo, descripcion, estado opcional; req.file opcional).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el equipo creado.
 */
async function crear(req, res, next) {
  try {
    const { codigo, descripcion, estado } = req.body;
    const codigoNormalizado = codigo.trim();

    const equipoExistente = await equiposModel.obtenerPorCodigo(codigoNormalizado);
    if (equipoExistente) {
      borrarImagenSiExiste(req.file?.filename);
      return error(res, 'Ya existe un equipo registrado con ese codigo', 409);
    }

    let estadoInicial = ESTADO_INICIAL_POR_DEFECTO;
    if (estado !== undefined) {
      if (!ESTADOS_PERMITIDOS_MANUALMENTE.includes(estado)) {
        borrarImagenSiExiste(req.file?.filename);
        return error(
          res,
          'El estado inicial del equipo debe ser DISPONIBLE, MANTENIMIENTO o INACTIVO',
          400
        );
      }
      estadoInicial = estado;
    }

    const nuevoId = await equiposModel.crear({
      codigo: codigoNormalizado,
      descripcion: descripcion.trim(),
      imagen: req.file?.filename || null,
      estado: estadoInicial,
    });

    const equipoCreado = await equiposModel.obtenerPorId(nuevoId);
    return ok(res, equipoCreado, 'Equipo registrado correctamente', 201);
  } catch (err) {
    // El codigo es UNIQUE en la base de datos: doble seguro por si dos
    // solicitudes llegan casi al mismo tiempo y ambas pasan la
    // verificacion previa (condicion de carrera).
    if (err.code === 'ER_DUP_ENTRY') {
      borrarImagenSiExiste(req.file?.filename);
      return error(res, 'Ya existe un equipo registrado con ese codigo', 409);
    }
    borrarImagenSiExiste(req.file?.filename);
    next(err);
  }
}

/**
 * Actualiza un equipo existente (codigo, descripcion, estado y,
 * opcionalmente, una nueva imagen). El estado PRESTADO no puede
 * asignarse desde aqui: ese cambio le corresponde al modulo de
 * Prestamos al registrar un prestamo o una devolucion.
 * @param {object} req - Request de Express (params.id, req.body, req.file opcional).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el equipo actualizado.
 */
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { codigo, descripcion, estado } = req.body;
    const codigoNormalizado = codigo.trim();

    const equipoActual = await equiposModel.obtenerPorId(id);
    if (!equipoActual) {
      borrarImagenSiExiste(req.file?.filename);
      return error(res, 'Equipo no encontrado', 404);
    }

    if (estado === 'PRESTADO' && equipoActual.estado !== 'PRESTADO') {
      borrarImagenSiExiste(req.file?.filename);
      return error(
        res,
        'El estado PRESTADO se asigna automaticamente al registrar un prestamo, no se puede establecer manualmente',
        400
      );
    }

    // Si el nuevo codigo pertenece a otro equipo, es un duplicado
    const equipoConEseCodigo = await equiposModel.obtenerPorCodigo(codigoNormalizado);
    if (equipoConEseCodigo && equipoConEseCodigo.id !== Number(id)) {
      borrarImagenSiExiste(req.file?.filename);
      return error(res, 'Ya existe otro equipo registrado con ese codigo', 409);
    }

    const datosActualizados = {
      codigo: codigoNormalizado,
      descripcion: descripcion.trim(),
      estado,
    };

    // Solo se toca la imagen si llego un archivo nuevo; si no, se
    // conserva la imagen actual del equipo.
    if (req.file) {
      datosActualizados.imagen = req.file.filename;
    }

    await equiposModel.actualizar(id, datosActualizados);

    // Ya con la actualizacion aplicada con exito, se borra la imagen
    // anterior del disco (si habia una y se reemplazo por otra nueva).
    if (req.file && equipoActual.imagen) {
      borrarImagenSiExiste(equipoActual.imagen);
    }

    const equipoActualizado = await equiposModel.obtenerPorId(id);
    return ok(res, equipoActualizado, 'Equipo actualizado correctamente');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      borrarImagenSiExiste(req.file?.filename);
      return error(res, 'Ya existe otro equipo registrado con ese codigo', 409);
    }
    borrarImagenSiExiste(req.file?.filename);
    next(err);
  }
}

/**
 * Cambia unicamente el estado de un equipo (ej. enviarlo a
 * MANTENIMIENTO o marcarlo INACTIVO). No permite establecer
 * PRESTADO manualmente, por la misma razon que en actualizar().
 * @param {object} req - Request de Express (params.id, req.body.estado).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el equipo actualizado.
 */
async function cambiarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!ESTADOS_PERMITIDOS_MANUALMENTE.includes(estado)) {
      return error(
        res,
        'El estado PRESTADO se asigna automaticamente al registrar un prestamo, no se puede establecer manualmente',
        400
      );
    }

    const equipoActual = await equiposModel.obtenerPorId(id);
    if (!equipoActual) return error(res, 'Equipo no encontrado', 404);

    if (equipoActual.estado === 'PRESTADO') {
      return error(
        res,
        'El equipo esta actualmente prestado; debe registrarse su devolucion antes de cambiar el estado',
        409
      );
    }

    await equiposModel.actualizarEstado(id, estado);

    const equipoActualizado = await equiposModel.obtenerPorId(id);
    return ok(res, equipoActualizado, 'Estado del equipo actualizado correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Elimina un equipo del inventario, junto con su imagen en disco.
 * Si el equipo tiene prestamos asociados (llave foranea RESTRICT en
 * prestamo_detalle), la base de datos rechaza el borrado y se traduce
 * a un mensaje entendible para el cliente en lugar de un error 500.
 * @param {object} req - Request de Express (params.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP confirmando la eliminacion.
 */
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;

    const equipo = await equiposModel.obtenerPorId(id);
    if (!equipo) return error(res, 'Equipo no encontrado', 404);

    if (equipo.estado === 'PRESTADO') {
      return error(res, 'No se puede eliminar un equipo que se encuentra actualmente prestado', 409);
    }

    await equiposModel.eliminar(id);
    borrarImagenSiExiste(equipo.imagen);

    return ok(res, null, 'Equipo eliminado correctamente');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return error(res, 'No se puede eliminar el equipo porque tiene prestamos registrados', 409);
    }
    next(err);
  }
}

export { listar, obtenerUno, crear, actualizar, cambiarEstado, eliminar };
