/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: prestamos.js
Autor: Dennis Marchena Delgado
Fecha: 21/08/2026
Modulo: Frontend - Prestamos y Devoluciones
Descripcion:
Capa de acceso a la API del módulo de préstamos.
//////////////////////////////////////////////////////////
*/

import { apiFetch } from './client.js';

/**
 * Obtiene los datos iniciales para el formulario: lista de usuarios y equipos disponibles.
 */
export async function obtenerDatosIniciales() {
  return apiFetch('/prestamos/datos-iniciales');
}

/**
 * Crea un nuevo préstamo.
 * @param {object} datos - { usuario_id, equipos_ids: [id, ...] }
 */
export async function crearPrestamo(datos) {
  return apiFetch('/prestamos', {
    method: 'POST',
    body: datos,
  });
}

/**
 * Obtiene un préstamo por su ID (con detalles).
 */
export async function obtenerPrestamo(id) {
  return apiFetch(`/prestamos/${id}`);
}

/**
 * Lista los préstamos con filtros opcionales.
 * @param {object} filtros - { usuario_id, fecha_inicio, fecha_fin, estado }
 */
export async function listarPrestamos(filtros = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filtros)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  }
  const qs = params.toString();
  return apiFetch(`/prestamos${qs ? `?${qs}` : ''}`);
}

/**
 * Registra la devolución de equipos de un préstamo.
 * @param {number|string} prestamoId
 * @param {Array<number>} equipos_ids
 */
export async function devolverEquipos(prestamoId, equipos_ids) {
  return apiFetch(`/prestamos/${prestamoId}/devolver`, {
    method: 'PUT',
    body: { equipos_ids },
  });
}

/**
 * Obtiene el historial de préstamos de un usuario.
 * @param {number|string} usuarioId
 * @param {object} filtros - { fecha_inicio, fecha_fin, estado }
 */
export async function historialPorUsuario(usuarioId, filtros = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filtros)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  }
  const qs = params.toString();
  return apiFetch(`/prestamos/usuario/${usuarioId}/historial${qs ? `?${qs}` : ''}`);
}