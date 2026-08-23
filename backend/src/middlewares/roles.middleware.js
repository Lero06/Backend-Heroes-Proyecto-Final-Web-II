/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: roles.middleware.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Middlewares
Descripcion:
Middleware de control de permisos por rol. Debe usarse SIEMPRE despues
de verificarSesion, ya que depende de req.usuario.
Uso: router.delete('/equipos/:id', verificarSesion, verificarRol('administrador'), controlador);
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
 * Genera un middleware que solo deja pasar a los roles indicados.
 * @param {...string} rolesPermitidos - Nombres de rol autorizados (ej. 'administrador').
 * @returns {Function} Middleware de Express.
 */
function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) return error(res, 'No autenticado', 401);

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return error(res, 'No tiene permisos para esta accion', 403);
    }

    next();
  };
}

export default verificarRol;
