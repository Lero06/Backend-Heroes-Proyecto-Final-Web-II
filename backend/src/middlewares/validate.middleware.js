// Middleware genérico de validación. Cada módulo puede definir su propio
// esquema (objeto con nombre_campo -> función validadora) y usar este
// wrapper para no repetir el patrón try/catch en cada controlador.
//
// Ejemplo de uso dentro de un módulo:
//
//   const validar = require('../../middlewares/validate.middleware');
//   const esquemaLogin = {
//     usuario: (v) => typeof v === 'string' && v.trim().length > 0,
//     password: (v) => typeof v === 'string' && v.length >= 6,
//   };
//   router.post('/login', validar(esquemaLogin), controlador);

const { error } = require('../utils/response');

function validar(esquema) {
  return (req, res, next) => {
    const errores = [];

    for (const [campo, esValido] of Object.entries(esquema)) {
      if (!esValido(req.body[campo])) {
        errores.push(campo);
      }
    }

    if (errores.length > 0) {
      return error(res, `Campos inválidos o faltantes: ${errores.join(', ')}`, 400);
    }

    next();
  };
}

module.exports = validar;
