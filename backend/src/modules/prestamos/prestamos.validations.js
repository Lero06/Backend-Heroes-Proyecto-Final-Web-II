/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: prestamos.validations.js
Autor: Dennis Marchena Delgado
Fecha: 21/08/2026
Modulo: Prestamos y Devoluciones
Descripcion:
Esquemas de validación para los endpoints del módulo de préstamos.
Se validan tipos y presencia, las reglas de negocio (disponibilidad,
duplicados, etc.) se aplican en el controlador.
//////////////////////////////////////////////////////////
*/

/**
 * Esquema para crear un préstamo.
 */
export const esquemaCrearPrestamo = {
  usuario_id: (v) => v !== undefined && v !== null && Number.isInteger(Number(v)) && Number(v) > 0,
  equipos_ids: (v) => Array.isArray(v) && v.length > 0 && v.every(id => Number.isInteger(Number(id)) && Number(id) > 0),
};

/**
 * Esquema para devolver equipos.
 */
export const esquemaDevolucion = {
  equipos_ids: (v) => Array.isArray(v) && v.length > 0 && v.every(id => Number.isInteger(Number(id)) && Number(id) > 0),
};

/**
 * Esquema para listar préstamos con filtros (query params).
 * Todos opcionales.
 */
export const esquemaListarPrestamos = {
  usuario_id: (v) => v === undefined || (v !== '' && !isNaN(Number(v)) && Number(v) > 0),
  fecha_inicio: (v) => v === undefined || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)),
  fecha_fin: (v) => v === undefined || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)),
  estado: (v) => v === undefined || ['ACTIVO', 'FINALIZADO'].includes(v),
};

/**
 * Esquema para historial de un usuario (query params opcionales).
 */
export const esquemaHistorial = {
  fecha_inicio: (v) => v === undefined || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)),
  fecha_fin: (v) => v === undefined || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)),
  estado: (v) => v === undefined || ['ACTIVO', 'FINALIZADO'].includes(v),
};