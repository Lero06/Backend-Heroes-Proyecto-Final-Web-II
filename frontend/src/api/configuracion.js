/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: configuracion.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Frontend - Configuración del Sistema
Descripcion:
Capa de acceso a la API del módulo de configuración del sistema
(especialmente para gestionar el rango de IP permitido en la BD).
//////////////////////////////////////////////////////////
*/

import { apiFetch } from './client.js';

/**
 * Obtiene la configuración del rango de IP permitido.
 */
export async function obtenerRangoIp() {
  return apiFetch('/configuracion/rango_ip_permitido');
}

/**
 * Actualiza el valor del rango de IP permitido (Solo administrador).
 * @param {string} valor - Nuevo rango o IP (ej. '0.0.0.0/0', '192.168.1.0/24').
 */
export async function actualizarRangoIp(valor) {
  return apiFetch('/configuracion/rango_ip_permitido', {
    method: 'PUT',
    body: { valor },
  });
}
