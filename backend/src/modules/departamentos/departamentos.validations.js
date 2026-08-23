/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: departamentos.validations.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Departamentos / Carreras
Descripcion:
Esquema de validacion de formato/presencia para crear y actualizar
departamentos. Se reutiliza el mismo esquema en ambos casos porque
los campos aceptados son los mismos (nombre obligatorio, descripcion
y encargado opcionales).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
ESQUEMAS DE VALIDACION
//////////////////////////////////////////////////////////
*/

/**
 * Esquema de validacion para crear/actualizar un departamento.
 */
const esquemaDepartamento = {
  nombre: (v) => typeof v === 'string' && v.trim().length >= 3,
  descripcion: (v) => v === undefined || v === null || typeof v === 'string',
  encargado: (v) => v === undefined || v === null || typeof v === 'string',
};

export { esquemaDepartamento };
