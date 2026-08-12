// Middleware de sesión: los demás módulos lo importan para proteger rutas.
// Uso:  router.get('/perfil', verificarSesion, controlador)

const { obtenerSesion, SESSION_COOKIE } = require('../utils/session');
const { error } = require('../utils/response');

async function verificarSesion(req, res, next) {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (!sid) return error(res, 'No autenticado', 401);

  try {
    const sesion = await obtenerSesion(sid);
    if (!sesion) return error(res, 'Sesión inválida o expirada', 401);

    req.usuario = {
      id: sesion.usuario_id,
      usuario: sesion.usuario,
      correo: sesion.correo,
      rolId: sesion.rol_id,
      rol: sesion.rol,
    };
    req.sessionId = sesion.id;
    next();
  } catch (err) {
    next(err); // lo captura el error.middleware.js
  }
}

module.exports = verificarSesion;
