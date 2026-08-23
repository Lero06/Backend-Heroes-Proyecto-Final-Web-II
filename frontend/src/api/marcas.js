/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: marcas.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Frontend - Marcas (Entrada/Salida)
Descripcion:
Capa de acceso a la API del modulo de marcas. Expone funciones para
registrar asistencia (marcar entrada/salida), obtener el estado actual
de la asistencia e IP, y consultar el historial de marcas con calculo de horas.
//////////////////////////////////////////////////////////
*/

import { apiFetch } from './client.js';

/**
 * Registra una marca de asistencia (alterna automaticamente ENTRADA / SALIDA).
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function marcarAsistencia() {
  return apiFetch('/marcas/marcar', {
    method: 'POST',
    body: {},
  });
}

/**
 * Obtiene el estado actual de asistencia del usuario (DENTRO/FUERA, IP y estado del dispositivo).
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function obtenerEstadoActual() {
  return apiFetch('/marcas/estado-actual');
}

/**
 * Obtiene el historial de marcas del usuario autenticado con la duracion calculada.
 * @returns {Promise<{ok: boolean, data: Array, message: string}>}
 */
export async function obtenerMisMarcas() {
  return apiFetch('/marcas/mis-marcas');
}
