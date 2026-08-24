/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: dispositivos.routes.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Dispositivos Autorizados
Descripcion:
Rutas HTTP para la gestion de dispositivos autorizados. Todas las rutas
requieren sesion activa (verificarSesion).
Montado en app.js bajo el prefijo /api/dispositivos.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import express from 'express';
import verificarSesion from '../../middlewares/auth.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';
import {
  esquemaRegistrarDispositivo,
  esquemaActualizarEstado,
} from './dispositivos.validations.js';
import {
  registrarDispositivo,
  seleccionarDispositivo,
  listarMisDispositivos,
  cambiarEstadoDispositivo,
  eliminarDispositivo,
} from './dispositivos.controller.js';

const router = express.Router();

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

// Registrar el dispositivo actual desde el que navega el usuario
router.post('/registrar', verificarSesion, validar(esquemaRegistrarDispositivo), registrarDispositivo);

// Seleccionar un dispositivo ya registrado para usar en este navegador
router.post('/:id/seleccionar', verificarSesion, seleccionarDispositivo);

// Consultar lista de mis dispositivos autorizados
router.get('/mis-dispositivos', verificarSesion, listarMisDispositivos);

// Modificar estado (ACTIVO / INACTIVO) de un dispositivo
router.put('/:id/estado', verificarSesion, validar(esquemaActualizarEstado), cambiarEstadoDispositivo);

// Eliminar / desvincular un dispositivo
router.delete('/:id', verificarSesion, eliminarDispositivo);

export default router;
