/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: auth.routes.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Autenticacion y Usuarios
Descripcion:
Define los endpoints publicos del modulo de autenticacion (registro,
login, logout, recuperacion y restablecimiento de contrasena) y los
conecta con sus validaciones y controladores. Este router se monta
en app.js bajo el prefijo /api/auth.
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
const {
  esquemaRegistro,
  esquemaLogin,
  esquemaRecuperarPassword,
  esquemaRestablecerPassword,
} = require('./auth.validations');
const { registrar, login, logout, recuperarPassword, restablecerPassword } = require('./auth.controller');

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

router.post('/registro', validar(esquemaRegistro), registrar);
router.post('/login', validar(esquemaLogin), login);
router.post('/logout', verificarSesion, logout);
router.post('/recuperar-password', validar(esquemaRecuperarPassword), recuperarPassword);
router.post('/restablecer-password', validar(esquemaRestablecerPassword), restablecerPassword);

module.exports = router;
