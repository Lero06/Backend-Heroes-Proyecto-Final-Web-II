/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: departamentos.routes.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Departamentos / Carreras
Descripcion:
Define los endpoints del CRUD de departamentos/carreras. Listar y
consultar quedan publicos (el formulario de registro los necesita sin
sesion activa); crear, actualizar y eliminar requieren sesion y rol
de administrador. Este router se monta en app.js bajo /api/departamentos.
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
import { esquemaDepartamento } from './departamentos.validations.js';
import { listar, obtenerUno, crear, actualizar, eliminar } from './departamentos.controller.js';

/*
//////////////////////////////////////////////////////////
RUTAS
//////////////////////////////////////////////////////////
*/

// Publicas: las usa el formulario de registro y los reportes
router.get('/', listar);
router.get('/:id', obtenerUno);

// Protegidas: solo administrador
router.post('/', verificarSesion, verificarRol('administrador'), validar(esquemaDepartamento), crear);
router.put('/:id', verificarSesion, verificarRol('administrador'), validar(esquemaDepartamento), actualizar);
router.delete('/:id', verificarSesion, verificarRol('administrador'), eliminar);

export default router;
