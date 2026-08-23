/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: departamentos.controller.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Departamentos / Carreras
Descripcion:
Logica de negocio del CRUD de departamentos. La consulta (listar/ver)
es publica porque el formulario de registro de usuario necesita
poblar el selector de departamentos antes de que exista una sesion;
crear, actualizar y eliminar quedan protegidos para administradores
(ver departamentos.routes.js).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { ok, error } from '../../utils/response.js';
import departamentosModel from './departamentos.model.js';

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Lista todos los departamentos registrados.
 * @param {object} req - Request de Express.
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el listado de departamentos.
 */
export async function listar(req, res, next) {
  try {
    const departamentos = await departamentosModel.obtenerTodos();
    return ok(res, departamentos, 'Departamentos obtenidos correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene un departamento por su id.
 * @param {object} req - Request de Express (req.params.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el departamento encontrado.
 */
export async function obtenerUno(req, res, next) {
  try {
    const id = Number(req.params.id);
    const departamento = await departamentosModel.obtenerPorId(id);

    if (!departamento) return error(res, 'Departamento no encontrado', 404);

    return ok(res, departamento, 'Departamento obtenido correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Crea un nuevo departamento. Requiere rol administrador.
 * @param {object} req - Request de Express (req.body con nombre, descripcion, encargado).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el departamento creado.
 */
export async function crear(req, res, next) {
  try {
    const { nombre, descripcion, encargado } = req.body;

    const nuevoId = await departamentosModel.crear({ nombre, descripcion, encargado });

    return ok(res, { id: nuevoId, nombre, descripcion, encargado }, 'Departamento creado correctamente', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * Actualiza un departamento existente. Requiere rol administrador.
 * @param {object} req - Request de Express (req.params.id y req.body).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP confirmando la actualizacion.
 */
export async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { nombre, descripcion, encargado } = req.body;

    const existente = await departamentosModel.obtenerPorId(id);
    if (!existente) return error(res, 'Departamento no encontrado', 404);

    await departamentosModel.actualizar(id, { nombre, descripcion, encargado });

    return ok(res, { id, nombre, descripcion, encargado }, 'Departamento actualizado correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Elimina un departamento. Requiere rol administrador.
 * Antes de eliminar, verifica que no existan usuarios asociados, para
 * no dejar informacion relacionada afectada (regla exigida por la guia).
 * @param {object} req - Request de Express (req.params.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP confirmando la eliminacion.
 */
export async function eliminar(req, res, next) {
  try {
    const id = Number(req.params.id);

    const existente = await departamentosModel.obtenerPorId(id);
    if (!existente) return error(res, 'Departamento no encontrado', 404);

    const usuariosAsociados = await departamentosModel.contarUsuariosAsociados(id);
    if (usuariosAsociados > 0) {
      return error(
        res,
        `No se puede eliminar: ${usuariosAsociados} usuario(s) pertenecen a este departamento`,
        409
      );
    }

    await departamentosModel.eliminar(id);

    return ok(res, null, 'Departamento eliminado correctamente');
  } catch (err) {
    next(err);
  }
}
