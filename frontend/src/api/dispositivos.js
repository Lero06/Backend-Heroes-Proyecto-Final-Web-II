/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: dispositivos.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Frontend - Dispositivos Autorizados
Descripcion:
Capa de acceso a la API del modulo de dispositivos autorizados.
Expone funciones para registrar el dispositivo actual del navegador,
seleccionar un dispositivo en el navegador, listar dispositivos,
actualizar su estado y eliminarlos.
//////////////////////////////////////////////////////////
*/

import { apiFetch } from './client.js';

/**
 * Registra y autoriza el dispositivo/navegador actual.
 * @param {object} datos - Datos del dispositivo ({ nombre, descripcion }).
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function registrarDispositivo(datos) {
  return apiFetch('/dispositivos/registrar', {
    method: 'POST',
    body: datos,
  });
}

/**
 * Selecciona un dispositivo previamente registrado para vincularlo al navegador actual.
 * @param {string} id - UUID del dispositivo.
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function seleccionarDispositivo(id) {
  return apiFetch(`/dispositivos/${id}/seleccionar`, {
    method: 'POST',
  });
}

/**
 * Desvincula el dispositivo actualmente asociado a este navegador.
 * @returns {Promise<{ok: boolean, data: null, message: string}>}
 */
export async function deseleccionarDispositivo() {
  return apiFetch('/dispositivos/deseleccionar', {
    method: 'POST',
  });
}

/**
 * Obtiene la lista de dispositivos registrados por el usuario autenticado.
 * @returns {Promise<{ok: boolean, data: Array, message: string}>}
 */
export async function obtenerMisDispositivos() {
  return apiFetch('/dispositivos/mis-dispositivos');
}

/**
 * Cambia el estado (ACTIVO o INACTIVO) de un dispositivo.
 * @param {string} id - UUID del dispositivo.
 * @param {string} estado - 'ACTIVO' o 'INACTIVO'.
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function cambiarEstadoDispositivo(id, estado) {
  return apiFetch(`/dispositivos/${id}/estado`, {
    method: 'PUT',
    body: { estado },
  });
}

/**
 * Elimina un dispositivo de la lista de autorizados.
 * @param {string} id - UUID del dispositivo.
 * @returns {Promise<{ok: boolean, data: null, message: string}>}
 */
export async function eliminarDispositivo(id) {
  return apiFetch(`/dispositivos/${id}`, {
    method: 'DELETE',
  });
}
