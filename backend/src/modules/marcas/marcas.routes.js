/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: marcas.routes.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Marcas (Entrada/Salida)
Descripcion:
Rutas HTTP para el registro de marcas y consulta de estado/historial.
Todas las rutas requieren sesion activa (verificarSesion).
Montado en app.js bajo el prefijo /api/marcas.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import express from 'express';
import verificarSesion from '../../middlewares/auth.middleware.js';
import {
  marcar,
  obtenerEstadoActual,
  listarMisMarcas,
} from './marcas.controller.js';

const router = express.Router();

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

// Registrar una nueva marca (alterna automaticamente ENTRADA / SALIDA)
router.post('/marcar', verificarSesion, marcar);

// Consultar el estado actual del usuario (DENTRO / FUERA)
router.get('/estado-actual', verificarSesion, obtenerEstadoActual);

// Consultar historial de marcas del usuario autenticado
router.get('/mis-marcas', verificarSesion, listarMisMarcas);

export default router;
