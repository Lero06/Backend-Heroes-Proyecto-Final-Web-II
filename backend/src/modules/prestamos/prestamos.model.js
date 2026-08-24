/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: prestamos.model.js
Autor: Dennis Marchena Delgado
Fecha: 21/08/2026
Modulo: Prestamos y Devoluciones
Descripcion:
Acceso a datos para la tabla `prestamos` y `prestamo_detalle`.
Incluye consultas para crear prestamos, listar, obtener detalle,
actualizar devoluciones y obtener historial con filtros.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import pool from '../../config/db.js';

/*
//////////////////////////////////////////////////////////
FUNCIONES DE ACCESO A DATOS
//////////////////////////////////////////////////////////
*/

/**
 * Obtiene la lista de todos los usuarios (id, nombre_completo, usuario)
 * para poblar el selector en el frontend.
 * @returns {Promise<Array<object>>}
 */
export async function obtenerUsuariosParaPrestamo() {
  const [rows] = await pool.query(
    'SELECT id, nombre_completo, usuario FROM usuarios ORDER BY nombre_completo'
  );
  return rows;
}

/**
 * Obtiene la lista de equipos disponibles (estado = 'DISPONIBLE')
 * para mostrar en el selector al crear un préstamo.
 * @returns {Promise<Array<object>>}
 */
export async function obtenerEquiposDisponibles() {
  const [rows] = await pool.query(
    'SELECT id, codigo, descripcion FROM equipos WHERE estado = "DISPONIBLE" ORDER BY codigo'
  );
  return rows;
}

/**
 * Crea un nuevo préstamo (encabezado) y sus detalles.
 * @param {number} usuarioId - ID del usuario que recibe el préstamo.
 * @param {number} encargadoId - ID del usuario (administrador) que registra.
 * @param {Array<number>} equiposIds - Lista de IDs de equipos a prestar.
 * @returns {Promise<{prestamoId: number, detalles: Array}>}
 */
export async function crearPrestamo(usuarioId, encargadoId, equiposIds) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insertar encabezado
    const [resultPrestamo] = await connection.query(
      'INSERT INTO prestamos (usuario_id, encargado_id, estado) VALUES (?, ?, "ACTIVO")',
      [usuarioId, encargadoId]
    );
    const prestamoId = resultPrestamo.insertId;

    // Insertar detalles y actualizar estado de equipos a PRESTADO
    const detallesInsertados = [];
    for (const equipoId of equiposIds) {
      await connection.query(
        'INSERT INTO prestamo_detalle (prestamo_id, equipo_id) VALUES (?, ?)',
        [prestamoId, equipoId]
      );
      // Cambiar estado del equipo a PRESTADO
      await connection.query(
        'UPDATE equipos SET estado = "PRESTADO" WHERE id = ?',
        [equipoId]
      );
      detallesInsertados.push(equipoId);
    }

    await connection.commit();
    return { prestamoId, detalles: detallesInsertados };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Obtiene un préstamo por su ID, incluyendo los detalles con información de equipos.
 * @param {number} prestamoId
 * @returns {Promise<object|null>}
 */
export async function obtenerPrestamoPorId(prestamoId) {
  const [prestamos] = await pool.query(
    `SELECT p.id, p.usuario_id, u.nombre_completo AS usuario_nombre,
            p.encargado_id, e2.nombre_completo AS encargado_nombre,
            p.fecha, p.estado
     FROM prestamos p
     JOIN usuarios u ON u.id = p.usuario_id
     JOIN usuarios e2 ON e2.id = p.encargado_id
     WHERE p.id = ?`,
    [prestamoId]
  );
  if (prestamos.length === 0) return null;

  const prestamo = prestamos[0];

  // Obtener detalles
  const [detalles] = await pool.query(
    `SELECT d.id, d.equipo_id, d.estado_devolucion, d.fecha_devolucion,
            eq.codigo, eq.descripcion, eq.estado AS equipo_estado
     FROM prestamo_detalle d
     JOIN equipos eq ON eq.id = d.equipo_id
     WHERE d.prestamo_id = ?`,
    [prestamoId]
  );
  prestamo.detalles = detalles;
  return prestamo;
}

/**
 * Lista los préstamos con filtros opcionales.
 * @param {object} filtros - { usuarioId, fechaInicio, fechaFin, estado }
 * @returns {Promise<Array>}
 */
export async function listarPrestamos({ usuarioId, fechaInicio, fechaFin, estado } = {}) {
  const condiciones = [];
  const valores = [];

  if (usuarioId) {
    condiciones.push('p.usuario_id = ?');
    valores.push(usuarioId);
  }
  if (fechaInicio) {
    condiciones.push('DATE(p.fecha) >= ?');
    valores.push(fechaInicio);
  }
  if (fechaFin) {
    condiciones.push('DATE(p.fecha) <= ?');
    valores.push(fechaFin);
  }
  if (estado) {
    condiciones.push('p.estado = ?');
    valores.push(estado);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT p.id, p.usuario_id, u.nombre_completo AS usuario_nombre,
            p.encargado_id, e.nombre_completo AS encargado_nombre,
            p.fecha, p.estado,
            (SELECT COUNT(*) FROM prestamo_detalle WHERE prestamo_id = p.id) AS total_equipos,
            (SELECT COUNT(*) FROM prestamo_detalle WHERE prestamo_id = p.id AND estado_devolucion = 'DEVUELTO') AS devueltos
     FROM prestamos p
     JOIN usuarios u ON u.id = p.usuario_id
     JOIN usuarios e ON e.id = p.encargado_id
     ${where}
     ORDER BY p.fecha DESC`,
    valores
  );
  return rows;
}

/**
 * Registra la devolución de uno o varios equipos de un préstamo.
 * @param {number} prestamoId
 * @param {Array<number>} equipoIds - IDs de equipos a devolver.
 * @returns {Promise<{devolucionDetalles: Array}>}
 */
export async function devolverEquipos(prestamoId, equipoIds) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const detallesDevueltos = [];
    for (const equipoId of equipoIds) {
      // Actualizar el detalle a DEVUELTO con fecha actual
      const [updateResult] = await connection.query(
        `UPDATE prestamo_detalle
         SET estado_devolucion = 'DEVUELTO', fecha_devolucion = NOW()
         WHERE prestamo_id = ? AND equipo_id = ? AND estado_devolucion = 'PENDIENTE'`,
        [prestamoId, equipoId]
      );
      if (updateResult.affectedRows === 0) {
        throw new Error(`El equipo ${equipoId} no está pendiente en este préstamo.`);
      }
      // Cambiar estado del equipo a DISPONIBLE
      await connection.query(
        'UPDATE equipos SET estado = "DISPONIBLE" WHERE id = ?',
        [equipoId]
      );
      detallesDevueltos.push(equipoId);
    }

    // Verificar si todos los detalles del préstamo están devueltos
    const [pendientes] = await connection.query(
      'SELECT COUNT(*) AS pendientes FROM prestamo_detalle WHERE prestamo_id = ? AND estado_devolucion = "PENDIENTE"',
      [prestamoId]
    );
    if (pendientes[0].pendientes === 0) {
      // Si no hay pendientes, marcar el préstamo como FINALIZADO
      await connection.query(
        'UPDATE prestamos SET estado = "FINALIZADO" WHERE id = ?',
        [prestamoId]
      );
    }

    await connection.commit();
    return { detallesDevueltos };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Obtiene el historial de préstamos de un usuario específico.
 * @param {number} usuarioId
 * @param {object} filtros - { fechaInicio, fechaFin, estado }
 * @returns {Promise<Array>}
 */
export async function historialPorUsuario(usuarioId, { fechaInicio, fechaFin, estado } = {}) {
  const condiciones = ['p.usuario_id = ?'];
  const valores = [usuarioId];

  if (fechaInicio) {
    condiciones.push('DATE(p.fecha) >= ?');
    valores.push(fechaInicio);
  }
  if (fechaFin) {
    condiciones.push('DATE(p.fecha) <= ?');
    valores.push(fechaFin);
  }
  if (estado) {
    condiciones.push('p.estado = ?');
    valores.push(estado);
  }

  const [rows] = await pool.query(
    `SELECT p.id, p.fecha, p.estado,
            e.nombre_completo AS encargado_nombre,
            (SELECT COUNT(*) FROM prestamo_detalle WHERE prestamo_id = p.id) AS total_equipos,
            (SELECT COUNT(*) FROM prestamo_detalle WHERE prestamo_id = p.id AND estado_devolucion = 'DEVUELTO') AS devueltos
     FROM prestamos p
     JOIN usuarios e ON e.id = p.encargado_id
     WHERE ${condiciones.join(' AND ')}
     ORDER BY p.fecha DESC`,
    valores
  );
  return rows;
}

export default {
  obtenerUsuariosParaPrestamo,
  obtenerEquiposDisponibles,
  crearPrestamo,
  obtenerPrestamoPorId,
  listarPrestamos,
  devolverEquipos,
  historialPorUsuario,
};