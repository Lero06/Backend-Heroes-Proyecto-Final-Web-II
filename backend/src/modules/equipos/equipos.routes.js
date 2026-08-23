/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: equipos.routes.js
Autor: Jose Rodolfo Chaves Herrera
Fecha: 22/08/2026
Modulo: Inventario de Equipos
Descripcion:
Define los endpoints del inventario de equipos. La consulta
(listar/obtener uno) esta disponible para cualquier usuario
autenticado; el resto de operaciones (crear, actualizar, cambiar
estado, eliminar) se restringen al rol administrador. Este router se
monta en app.js bajo el prefijo /api/equipos.
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
import verificarRol from '../../middlewares/roles.middleware.js';
import subirImagen from '../../middlewares/upload.middleware.js';
import {
  esquemaCrearEquipo,
  esquemaActualizarEquipo,
  esquemaCambiarEstado,
} from './equipos.validations.js';
import { listar, obtenerUno, crear, actualizar, cambiarEstado, eliminar } from './equipos.controller.js';

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

// Todas las rutas requieren sesion activa
router.use(verificarSesion);

// GET /api/equipos            -> lista el inventario (filtro opcional ?estado=)
router.get('/', listar);

// GET /api/equipos/:id        -> detalle de un equipo
router.get('/:id', obtenerUno);

// POST /api/equipos           -> registra un equipo nuevo (con imagen opcional)
router.post(
  '/',
  verificarRol('administrador'),
  subirImagen('imagen', 'equipos'),
  validar(esquemaCrearEquipo),
  crear
);

// PUT /api/equipos/:id        -> actualiza un equipo (con imagen opcional)
router.put(
  '/:id',
  verificarRol('administrador'),
  subirImagen('imagen', 'equipos'),
  validar(esquemaActualizarEquipo),
  actualizar
);

// PATCH /api/equipos/:id/estado -> cambia unicamente el estado del equipo
router.patch(
  '/:id/estado',
  verificarRol('administrador'),
  validar(esquemaCambiarEstado),
  cambiarEstado
);

// DELETE /api/equipos/:id     -> elimina un equipo del inventario
router.delete('/:id', verificarRol('administrador'), eliminar);

export default router;
