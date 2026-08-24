/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: configuracion.validations.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Configuración del Sistema
Descripcion:
Esquema de validación para actualizar parámetros de configuración.
//////////////////////////////////////////////////////////
*/

export const esquemaActualizarConfiguracion = {
  valor: (v) => typeof v === 'string' && v.trim().length > 0,
};
