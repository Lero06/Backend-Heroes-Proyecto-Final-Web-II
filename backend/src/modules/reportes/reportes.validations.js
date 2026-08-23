/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: reportes.validations.js
Autor: Gloriana Carrillo Alfaro
Fecha: 18/08/2026
Modulo: Reportes / Filtros / Exportacion
Descripcion:
Esquema de validacion de los query params del modulo de reportes.
Todos los filtros son opcionales; si vienen, deben ser numericos.
Se usa con el middleware validar() adaptado a req.query (ver
reportes.routes.js que pasa { source: 'query' } al middleware, o
bien la validacion se hace directamente en el controlador mediante
leerFiltros()).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
ESQUEMAS DE VALIDACION
//////////////////////////////////////////////////////////
*/

/**
 * Validador de campo numerico opcional para query params.
 * Acepta undefined (campo ausente) o cualquier string que represente
 * un numero entero positivo.
 * @param {string|undefined} v - Valor del query param.
 * @returns {boolean} true si el valor es valido.
 */
const esNumericoOpcional = (v) => v === undefined || (v !== '' && !isNaN(Number(v)) && Number(v) > 0);

/**
 * Esquema de validacion para los filtros opcionales del reporte de marcas.
 * Cada llave corresponde a un query param; la funcion devuelve true si es valido.
 */
const esquemaFiltrosReporte = {
  usuario:     esNumericoOpcional,
  departamento: esNumericoOpcional,
  anio:        esNumericoOpcional,
  mes:         esNumericoOpcional,
  dia:         esNumericoOpcional,
};

export { esquemaFiltrosReporte };
