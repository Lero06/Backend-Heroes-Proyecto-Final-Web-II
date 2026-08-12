/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: response.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Utilidades
Descripcion:
Helper para estandarizar el formato de respuesta de toda la API:
{ ok: boolean, data: any, message: string }. Todos los controladores
del proyecto deben usar ok()/error() en lugar de res.json() directo,
para que el frontend siempre reciba la misma estructura.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Envia una respuesta exitosa con el formato estandar de la API.
 * @param {object} res - Objeto response de Express.
 * @param {any} [data=null] - Datos a devolver al cliente.
 * @param {string} [message='OK'] - Mensaje descriptivo para el cliente.
 * @param {number} [status=200] - Codigo HTTP de la respuesta.
 * @returns {object} Respuesta HTTP enviada.
 */
function ok(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({ ok: true, data, message });
}

/**
 * Envia una respuesta de error con el formato estandar de la API.
 * Nunca debe incluir detalles internos del servidor o de la base de datos.
 * @param {object} res - Objeto response de Express.
 * @param {string} [message='Error'] - Mensaje de error para el cliente.
 * @param {number} [status=400] - Codigo HTTP de la respuesta.
 * @param {any} [data=null] - Datos adicionales del error (opcional).
 * @returns {object} Respuesta HTTP enviada.
 */
function error(res, message = 'Error', status = 400, data = null) {
  return res.status(status).json({ ok: false, data, message });
}

module.exports = { ok, error };
