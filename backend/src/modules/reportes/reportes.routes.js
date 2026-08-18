/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: reportes.routes.js
Autor: Gloriana Carrillo Alfaro
Fecha: 18/08/2026
Modulo: Reportes / Filtros / Exportacion
Descripcion:
Define los endpoints del modulo de reportes de marcas. Todas las rutas
requieren sesion activa y rol de administrador, ya que el reporte
completo es una funcion exclusiva de administracion segun la guia del
proyecto. Este router se monta en app.js bajo /api/reportes.

Nota sobre validacion de query params: el middleware validar() existente
opera sobre req.body. Para query params la validacion equivalente se
realiza dentro del controlador mediante leerFiltros(), que castea y
descarta valores invalidos antes de pasarlos al model.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

const express = require('express');
const router  = express.Router();

const { error }       = require('../../utils/response');
const verificarSesion = require('../../middlewares/auth.middleware');
const verificarRol    = require('../../middlewares/roles.middleware');
const validar         = require('../../middlewares/validate.middleware');
const { esquemaFiltrosReporte } = require('./reportes.validations');
const {
  listarReporte,
  exportarJSON,
  exportarXML,
  exportarPDF,
} = require('./reportes.controller');

/*
//////////////////////////////////////////////////////////
MIDDLEWARE DE VALIDACION DE QUERY PARAMS
//////////////////////////////////////////////////////////
*/

/**
 * Adaptador del middleware validar() para query params.
 * El middleware original valida req.body; este wrapper redirige la
 * validacion a req.query para los filtros opcionales del reporte.
 * @param {object} esquema - Esquema de validacion (campo -> funcion).
 * @returns {Function} Middleware de Express.
 */
function validarQuery(esquema) {
  return (req, res, next) => {
    // Reutilizamos la misma logica que validar(), pero sobre req.query
    const errores = [];
    for (const [campo, esValido] of Object.entries(esquema)) {
      if (!esValido(req.query[campo])) {
        errores.push(campo);
      }
    }
    if (errores.length > 0) {
      return error(res, `Parametros de filtro invalidos: ${errores.join(', ')}`, 400);
    }
    next();
  };
}

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

// Todas las rutas de reportes requieren sesion activa y rol administrador
router.use(verificarSesion, verificarRol('administrador'));

// GET /api/reportes              -> reporte en formato JSON estandar de la API
router.get('/', validarQuery(esquemaFiltrosReporte), listarReporte);

// GET /api/reportes/exportar/json -> descarga el reporte como archivo JSON
router.get('/exportar/json', validarQuery(esquemaFiltrosReporte), exportarJSON);

// GET /api/reportes/exportar/xml  -> descarga el reporte como archivo XML
router.get('/exportar/xml', validarQuery(esquemaFiltrosReporte), exportarXML);

// GET /api/reportes/exportar/pdf  -> descarga el reporte como archivo PDF
router.get('/exportar/pdf', validarQuery(esquemaFiltrosReporte), exportarPDF);

module.exports = router;
