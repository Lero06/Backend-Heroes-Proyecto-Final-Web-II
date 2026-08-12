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

const express = require('express');
const router = express.Router();

const validar = require('../../middlewares/validate.middleware');
const verificarSesion = require('../../middlewares/auth.middleware');
const verificarRol = require('../../middlewares/roles.middleware');
const { esquemaDepartamento } = require('./departamentos.validations');
const { listar, obtenerUno, crear, actualizar, eliminar } = require('./departamentos.controller');

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

module.exports = router;
