/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: auth.middleware.js
Autor: Leandro Sanchez Rojas / Adaptado a ESM por Marco Vásquez
Fecha: 22/08/2026
Modulo: Middlewares
Descripcion:
Middleware que protege rutas verificando que exista una sesion valida.
Cada integrante del equipo debe importar este middleware en sus propias
rutas para requerir que el usuario este autenticado.
Uso: router.get('/perfil', verificarSesion, controlador);
Adaptado a ES Modules (import/export).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { obtenerSesion, SESSION_COOKIE } from '../utils/session.js';
import { error } from '../utils/response.js';

/*
//////////////////////////////////////////////////////////
FUNCION PRINCIPAL
//////////////////////////////////////////////////////////
*/

/**
 * Verifica que la peticion incluya una cookie de sesion valida.
 * Si es valida, agrega `req.usuario` (id, usuario, correo, rol) y
 * `req.sessionId` para que el resto de la cadena los use.
 * @param {object} req - Objeto request de Express.
 * @param {object} res - Objeto response de Express.
 * @param {Function} next - Siguiente middleware/controlador.
 * @returns {Promise<void>}
 */
export async function verificarSesion(req, res, next) {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (!sid) return error(res, 'No autenticado', 401);

  try {
    const sesion = await obtenerSesion(sid);
    if (!sesion) return error(res, 'Sesion invalida o expirada', 401);

    req.usuario = {
      id: sesion.usuario_id,
      nombre_completo: sesion.nombre_completo,
      usuario: sesion.usuario,
      correo: sesion.correo,
      rolId: sesion.rol_id,
      rol: sesion.rol,
    };
    req.sessionId = sesion.id;
    next();
  } catch (err) {
    next(err); // lo captura error.middleware.js
  }
}

export default verificarSesion;
