/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: marcas.validations.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Marcas (Entrada/Salida)
Descripcion:
Esquemas de validacion opcionales para la peticion de marcas.
//////////////////////////////////////////////////////////
*/

/**
 * Esquema opcional si se envia un dispositivo_id explicito en el body.
 */
export const esquemaMarcar = {
  dispositivo_id: (v) => v === undefined || v === null || (typeof v === 'string' && v.trim().length > 0),
};
