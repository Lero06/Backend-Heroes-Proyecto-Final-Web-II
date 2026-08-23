/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: error.middleware.js
Autor: Leandro Sanchez Rojas / Adaptado a ESM por Marco Vásquez
Fecha: 22/08/2026
Modulo: Middlewares
Descripcion:
Manejador de errores centralizado de la aplicacion. Debe registrarse
al final de app.js, despues de todas las rutas, para capturar
cualquier error no controlado (incluido lo que pasan los next(err)
de los controladores). Nunca revela detalles internos al cliente.
Adaptado a ES Modules (import/export).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { error } from '../utils/response.js';

/*
//////////////////////////////////////////////////////////
FUNCION PRINCIPAL
//////////////////////////////////////////////////////////
*/

/**
 * Middleware de manejo de errores de Express (requiere los 4 parametros
 * para que Express lo reconozca como manejador de errores).
 * @param {Error} err - Error capturado en la cadena de middlewares/controladores.
 * @param {object} req - Objeto request de Express.
 * @param {object} res - Objeto response de Express.
 * @param {Function} next - Siguiente middleware (no se usa, pero es requerido por Express).
 * @returns {object} Respuesta HTTP con el formato estandar de error.
 */
export function manejadorErrores(err, req, res, next) {
  console.error(err); // log interno para depurar, nunca se envia al cliente

  const status = err.status || 500;
  const mensaje = status === 500 ? 'Error interno del servidor' : err.message;

  return error(res, mensaje, status);
}

export default manejadorErrores;
