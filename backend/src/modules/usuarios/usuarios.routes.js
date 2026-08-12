/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: usuarios.routes.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Usuarios (Perfil)
Descripcion:
Define los endpoints del perfil del usuario autenticado. Ambas rutas
requieren sesion activa. Este router se monta en app.js bajo el
prefijo /api/usuarios.
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
const { esquemaActualizarPerfil } = require('./usuarios.validations');
const { verPerfil, actualizarPerfil } = require('./usuarios.controller');

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

router.get('/perfil', verificarSesion, verPerfil);
router.put('/perfil', verificarSesion, validar(esquemaActualizarPerfil), actualizarPerfil);

// Proximo commit: /cambiar-password

module.exports = router;
