/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: configuracion.routes.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Configuración del Sistema
Descripcion:
Rutas HTTP para consultar y modificar configuraciones.
Montado en app.js bajo el prefijo /api/configuracion.
//////////////////////////////////////////////////////////
*/

import express from 'express';
import verificarSesion from '../../middlewares/auth.middleware.js';
import verificarRol from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';
import { esquemaActualizarConfiguracion } from './configuracion.validations.js';
import { listar, obtenerPorClave, actualizar } from './configuracion.controller.js';

const router = express.Router();

// Consulta publica o autenticada de configuracion
router.get('/', verificarSesion, listar);
router.get('/:clave', verificarSesion, obtenerPorClave);

// Modificación protegida (solo administrador)
router.put('/:clave', verificarSesion, verificarRol('administrador'), validar(esquemaActualizarConfiguracion), actualizar);

export default router;
