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

const express = require('express');
const router = express.Router();

const validar = require('../../middlewares/validate.middleware');
const verificarSesion = require('../../middlewares/auth.middleware');
const { esquemaActualizarPerfil, esquemaCambiarPassword } = require('./usuarios.validations');
const { verPerfil, actualizarPerfil, cambiarPassword } = require('./usuarios.controller');

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

router.get('/perfil', verificarSesion, verPerfil);
router.put('/perfil', verificarSesion, validar(esquemaActualizarPerfil), actualizarPerfil);
router.put('/cambiar-password', verificarSesion, validar(esquemaCambiarPassword), cambiarPassword);

module.exports = router;
