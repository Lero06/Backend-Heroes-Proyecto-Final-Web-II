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

import express from 'express';
const router = express.Router();

import validar from '../../middlewares/validate.middleware.js';
import verificarSesion from '../../middlewares/auth.middleware.js';
import {
  esquemaRegistro,
  esquemaLogin,
  esquemaRecuperarPassword,
  esquemaRestablecerPassword,
} from './auth.validations.js';
import { registrar, login, logout, recuperarPassword, restablecerPassword } from './auth.controller.js';

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

export default router;
