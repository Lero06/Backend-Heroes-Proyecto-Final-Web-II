/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: prestamos.routes.js
Autor: Dennis Marchena Delgado
Fecha: 21/08/2026
Modulo: Prestamos y Devoluciones
Descripcion:
Endpoints del módulo de préstamos. Todas las rutas requieren sesión
activa y rol de administrador, excepto las consultas de historial
(que también requieren admin). Montado en app.js bajo /api/prestamos.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import express from 'express';
const router = express.Router();

import verificarSesion from '../../middlewares/auth.middleware.js';
import verificarRol from '../../middlewares/roles.middleware.js';
import validar from '../../middlewares/validate.middleware.js';
import {
  esquemaCrearPrestamo,
  esquemaDevolucion,
  esquemaListarPrestamos,
  esquemaHistorial,
} from './prestamos.validations.js';
import {
  obtenerDatosIniciales,
  crearPrestamo,
  obtenerPrestamo,
  listarPrestamos,
  devolverEquipos,
  historialPorUsuario,
} from './prestamos.controller.js';

// Todas las rutas requieren sesión y administrador
router.use(verificarSesion, verificarRol('administrador'));

// GET /api/prestamos/datos-iniciales -> usuarios y equipos disponibles
router.get('/datos-iniciales', obtenerDatosIniciales);

// POST /api/prestamos -> crear préstamo
router.post('/', validar(esquemaCrearPrestamo), crearPrestamo);

// GET /api/prestamos -> listar con filtros
router.get('/', validar(esquemaListarPrestamos), listarPrestamos);

// GET /api/prestamos/:id -> obtener un préstamo con detalles
router.get('/:id', obtenerPrestamo);

// PUT /api/prestamos/:id/devolver -> devolver equipos
router.put('/:id/devolver', validar(esquemaDevolucion), devolverEquipos);

// GET /api/prestamos/usuario/:usuario_id/historial -> historial de un usuario
router.get('/usuario/:usuario_id/historial', validar(esquemaHistorial), historialPorUsuario);

export default router;