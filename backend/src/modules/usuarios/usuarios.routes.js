/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: usuarios.routes.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Usuarios (Perfil)
Descripcion:
Define los endpoints del perfil y del cambio de contrasena del usuario
autenticado. Todas las rutas requieren sesion activa. Este router se
monta en app.js bajo el prefijo /api/usuarios.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import express from 'express';
const router = express.Router();

import validar from '../../middlewares/validate.middleware.js';
import verificarSesion from '../../middlewares/auth.middleware.js';
import { esquemaActualizarPerfil, esquemaCambiarPassword } from './usuarios.validations.js';
import { verPerfil, actualizarPerfil, cambiarPassword } from './usuarios.controller.js';

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

router.get('/perfil', verificarSesion, verPerfil);
router.put('/perfil', verificarSesion, validar(esquemaActualizarPerfil), actualizarPerfil);
router.put('/cambiar-password', verificarSesion, validar(esquemaCambiarPassword), cambiarPassword);

export default router;
