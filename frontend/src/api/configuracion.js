/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: configuracion.js
Autor: Marco Vásquez
Fecha: 24/08/2026
Modulo: Frontend - Configuración del Sistema
Descripcion:
Capa de acceso a la API del módulo de configuración del sistema.
Expone funciones para listar todos los parámetros, consultar y actualizar
claves específicas (nombre_institucion, tiempo_max_sesion_min, tamano_max_archivo_mb,
rango_ip_permitido).
//////////////////////////////////////////////////////////
*/

import { apiFetch } from './client.js';

/**
 * Obtiene todas las configuraciones del sistema registradas en la base de datos.
 * @returns {Promise<{ok: boolean, data: Array<{id: number, clave: string, valor: string, descripcion: string}>, message: string}>}
 */
export async function obtenerConfiguraciones() {
  return apiFetch('/configuracion');
}

/**
 * Obtiene la configuración de una clave específica.
 * @param {string} clave - Nombre del parámetro.
 * @returns {Promise<{ok: boolean, data: {id: number, clave: string, valor: string, descripcion: string}, message: string}>}
 */
export async function obtenerConfiguracionPorClave(clave) {
  return apiFetch(`/configuracion/${clave}`);
}

/**
 * Actualiza el valor de una clave de configuración (Solo administrador).
 * @param {string} clave - Nombre del parámetro.
 * @param {string} valor - Nuevo valor a asignar.
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function actualizarConfiguracion(clave, valor) {
  return apiFetch(`/configuracion/${clave}`, {
    method: 'PUT',
    body: { valor },
  });
}

/**
 * Obtiene la configuración del rango de IP permitido (usado en Marcas).
 */
export async function obtenerRangoIp() {
  return apiFetch('/configuracion/rango_ip_permitido');
}

/**
 * Actualiza el valor del rango de IP permitido (usado en Marcas).
 * @param {string} valor - Nuevo rango o IP (ej. '0.0.0.0/0', '192.168.1.0/24').
 */
export async function actualizarRangoIp(valor) {
  return apiFetch('/configuracion/rango_ip_permitido', {
    method: 'PUT',
    body: { valor },
  });
}
