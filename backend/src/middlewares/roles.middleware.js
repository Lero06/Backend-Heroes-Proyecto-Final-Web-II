// Debe usarse SIEMPRE después de verificarSesion.
// Uso:  router.delete('/equipos/:id', verificarSesion, verificarRol('administrador'), controlador)

const { error } = require('../utils/response');

function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) return error(res, 'No autenticado', 401);

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return error(res, 'No tiene permisos para esta acción', 403);
    }

    next();
  };
}

module.exports = verificarRol;
