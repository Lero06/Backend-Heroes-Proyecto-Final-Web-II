/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: prestamos.controller.js
Autor: Dennis Marchena Delgado
Fecha: 21/08/2026
Modulo: Prestamos y Devoluciones
Descripcion:
Logica de negocio para crear prestamos, devolver equipos y consultar
historial. Incluye validaciones de disponibilidad, unicidad de equipos,
cambio de estados y manejo de transacciones.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { ok, error } from '../../utils/response.js';
import * as prestamosModel from './prestamos.model.js';

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Obtiene la lista de usuarios (para el selector) y equipos disponibles.
 * Se usa para poblar el formulario de creación de préstamos.
 */
export async function obtenerDatosIniciales(req, res, next) {
  try {
    const [usuarios, equipos] = await Promise.all([
      prestamosModel.obtenerUsuariosParaPrestamo(),
      prestamosModel.obtenerEquiposDisponibles(),
    ]);
    return ok(res, { usuarios, equipos }, 'Datos para préstamo obtenidos correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Crea un nuevo préstamo.
 * @param {object} req - req.body: { usuario_id, equipos_ids: [id, ...] }
 * @param {object} res
 */
export async function crearPrestamo(req, res, next) {
  try {
    const { usuario_id, equipos_ids } = req.body;
    const encargado_id = req.usuario.id; // usuario autenticado (debe ser admin)

    // Validaciones básicas
    if (!usuario_id) return error(res, 'Debe seleccionar un usuario', 400);
    if (!equipos_ids || !Array.isArray(equipos_ids) || equipos_ids.length === 0) {
      return error(res, 'Debe seleccionar al menos un equipo', 400);
    }

    // Verificar que no haya IDs duplicados
    const uniqueIds = new Set(equipos_ids);
    if (uniqueIds.size !== equipos_ids.length) {
      return error(res, 'No se permite duplicar equipos en el mismo préstamo', 400);
    }

    // Verificar que todos los equipos estén disponibles (consultar BD)
    // Esta verificación adicional se hace en el modelo dentro de la transacción,
    // pero podemos hacer una pre-validación para mensajes más claros.
    const disponibles = await prestamosModel.obtenerEquiposDisponibles();
    const disponiblesIds = new Set(disponibles.map(e => e.id));
    for (const id of equipos_ids) {
      if (!disponiblesIds.has(id)) {
        return error(res, `El equipo con ID ${id} no está disponible`, 400);
      }
    }

    const resultado = await prestamosModel.crearPrestamo(usuario_id, encargado_id, equipos_ids);
    const prestamoCompleto = await prestamosModel.obtenerPrestamoPorId(resultado.prestamoId);

    return ok(res, prestamoCompleto, 'Préstamo creado correctamente', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene un préstamo por su ID (incluye detalles).
 */
export async function obtenerPrestamo(req, res, next) {
  try {
    const { id } = req.params;
    const prestamo = await prestamosModel.obtenerPrestamoPorId(id);
    if (!prestamo) return error(res, 'Préstamo no encontrado', 404);
    return ok(res, prestamo, 'Préstamo obtenido correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Lista los préstamos con filtros.
 * Filtros vía query: ?usuario_id=, fecha_inicio=, fecha_fin=, estado=
 */
export async function listarPrestamos(req, res, next) {
  try {
    const { usuario_id, fecha_inicio, fecha_fin, estado } = req.query;
    const filtros = {
      usuarioId: usuario_id ? Number(usuario_id) : undefined,
      fechaInicio: fecha_inicio || undefined,
      fechaFin: fecha_fin || undefined,
      estado: estado || undefined,
    };
    const prestamos = await prestamosModel.listarPrestamos(filtros);
    return ok(res, prestamos, 'Préstamos listados correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Registra la devolución de uno o varios equipos de un préstamo.
 * @param {object} req - req.params.id (prestamo_id), req.body.equipos_ids: [id, ...]
 */
export async function devolverEquipos(req, res, next) {
  try {
    const { id } = req.params;
    const { equipos_ids } = req.body;

    if (!equipos_ids || !Array.isArray(equipos_ids) || equipos_ids.length === 0) {
      return error(res, 'Debe especificar al menos un equipo a devolver', 400);
    }

    // Verificar que el préstamo exista y esté activo
    const prestamo = await prestamosModel.obtenerPrestamoPorId(id);
    if (!prestamo) return error(res, 'Préstamo no encontrado', 404);
    if (prestamo.estado === 'FINALIZADO') {
      return error(res, 'Este préstamo ya está finalizado', 400);
    }

    // Verificar que los equipos estén pendientes en el préstamo
    const pendientes = prestamo.detalles.filter(d => d.estado_devolucion === 'PENDIENTE');
    const pendientesIds = new Set(pendientes.map(d => d.equipo_id));
    for (const eqId of equipos_ids) {
      if (!pendientesIds.has(eqId)) {
        return error(res, `El equipo ${eqId} no está pendiente en este préstamo`, 400);
      }
    }

    const resultado = await prestamosModel.devolverEquipos(id, equipos_ids);
    const prestamoActualizado = await prestamosModel.obtenerPrestamoPorId(id);

    return ok(
      res,
      prestamoActualizado,
      `Devolución de ${equipos_ids.length} equipo(s) registrada correctamente`
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene el historial de préstamos de un usuario específico.
 * @param {object} req - req.params.usuario_id, query con filtros opcionales
 */
export async function historialPorUsuario(req, res, next) {
  try {
    const { usuario_id } = req.params;
    const { fecha_inicio, fecha_fin, estado } = req.query;
    const filtros = {
      fechaInicio: fecha_inicio || undefined,
      fechaFin: fecha_fin || undefined,
      estado: estado || undefined,
    };
    const historial = await prestamosModel.historialPorUsuario(Number(usuario_id), filtros);
    return ok(res, historial, 'Historial obtenido correctamente');
  } catch (err) {
    next(err);
  }
}