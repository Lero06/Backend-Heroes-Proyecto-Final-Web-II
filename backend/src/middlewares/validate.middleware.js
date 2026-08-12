/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: validate.middleware.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Middlewares
Descripcion:
Middleware generico de validacion de body. Cada modulo define su
propio esquema (objeto con nombre_campo -> funcion validadora) y usa
este wrapper para no repetir el patron de validacion en cada
controlador.
Ejemplo de uso dentro de un modulo:
  const validar = require('../../middlewares/validate.middleware');
  const esquemaLogin = {
    usuario: (v) => typeof v === 'string' && v.trim().length > 0,
    password: (v) => typeof v === 'string' && v.length >= 6,
  };
  router.post('/login', validar(esquemaLogin), controlador);
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

const { error } = require('../utils/response');

/*
//////////////////////////////////////////////////////////
FUNCION PRINCIPAL
//////////////////////////////////////////////////////////
*/

/**
 * Genera un middleware que valida el body de la peticion contra un
 * esquema de funciones validadoras.
 * @param {Object<string, function(any): boolean>} esquema - Mapa campo -> funcion validadora.
 * @returns {Function} Middleware de Express.
 */
function validar(esquema) {
  return (req, res, next) => {
    const errores = [];

    for (const [campo, esValido] of Object.entries(esquema)) {
      if (!esValido(req.body[campo])) {
        errores.push(campo);
      }
    }

    if (errores.length > 0) {
      return error(res, `Campos invalidos o faltantes: ${errores.join(', ')}`, 400);
    }

    next();
  };
}

module.exports = validar;
