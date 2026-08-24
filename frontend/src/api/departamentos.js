/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: departamentos.js
Autor: Jose Rodolfo Chaves Herrera
Fecha: 24/08/2026
Modulo: Frontend - Departamentos / Carreras
Descripcion:
Funciones de comunicacion con los endpoints REST del modulo
de departamentos (/api/departamentos).
//////////////////////////////////////////////////////////
*/

import { apiFetch } from './client';

/**
 * Lista todos los departamentos registrados.
 * @returns {Promise<{ok: boolean, data: Array<object>, message: string}>}
 */
export async function listarDepartamentos() {
  return apiFetch('/departamentos');
}

/**
 * Obtiene un departamento especifico por ID.
 * @param {number|string} id - ID del departamento.
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function obtenerDepartamento(id) {
  return apiFetch(`/departamentos/${id}`);
}

/**
 * Registra un nuevo departamento. Requiere rol administrador.
 * @param {object} datos - { nombre, descripcion, encargado }
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function crearDepartamento(datos) {
  return apiFetch('/departamentos', {
    method: 'POST',
    body: datos,
  });
}

/**
 * Actualiza un departamento existente. Requiere rol administrador.
 * @param {number|string} id - ID del departamento a actualizar.
 * @param {object} datos - { nombre, descripcion, encargado }
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function actualizarDepartamento(id, datos) {
  return apiFetch(`/departamentos/${id}`, {
    method: 'PUT',
    body: datos,
  });
}

/**
 * Elimina un departamento por ID. Requiere rol administrador.
 * @param {number|string} id - ID del departamento.
 * @returns {Promise<{ok: boolean, data: null, message: string}>}
 */
export async function eliminarDepartamento(id) {
  return apiFetch(`/departamentos/${id}`, {
    method: 'DELETE',
  });
}
