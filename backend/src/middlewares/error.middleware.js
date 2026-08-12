// Manejador de errores centralizado. Debe registrarse AL FINAL de app.js,
// después de todas las rutas. Nunca revela detalles internos al cliente.

const { error } = require('../utils/response');

function manejadorErrores(err, req, res, next) {
  console.error(err); // log interno para depurar

  const status = err.status || 500;
  const mensaje = status === 500 ? 'Error interno del servidor' : err.message;

  return error(res, mensaje, status);
}

module.exports = manejadorErrores;
