/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: dispositivos.validations.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Dispositivos Autorizados
Descripcion:
Esquemas de validacion para el registro y modificacion de dispositivos.
//////////////////////////////////////////////////////////
*/

/**
 * Esquema de validacion para registrar un nuevo dispositivo.
 */
export const esquemaRegistrarDispositivo = {
  nombre: (v) => typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 100,
  descripcion: (v) => v === undefined || v === null || (typeof v === 'string' && v.length <= 255),
};

/**
 * Esquema de validacion para actualizar el estado de un dispositivo.
 */
export const esquemaActualizarEstado = {
  estado: (v) => typeof v === 'string' && ['ACTIVO', 'INACTIVO'].includes(v.toUpperCase()),
};
