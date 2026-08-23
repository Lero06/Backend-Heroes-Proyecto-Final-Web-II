/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: equipos.js
Autor: Jose Rodolfo Chaves Herrera
Fecha: 22/08/2026
Modulo: Frontend - Inventario de Equipos
Descripcion:
Capa de acceso a la API del modulo de inventario de equipos. Crear y
actualizar equipos usan FormData (no JSON) porque pueden llevar una
imagen adjunta; apiFetch ya sabe distinguir FormData automaticamente
y no le agrega Content-Type manual.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { apiFetch } from './client';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/*
//////////////////////////////////////////////////////////
FUNCIONES AUXILIARES
//////////////////////////////////////////////////////////
*/

/**
 * Arma el FormData que se envia al crear/actualizar un equipo.
 * Solo agrega `imagen` si se selecciono un archivo nuevo, para no
 * pisar la imagen actual cuando el formulario se envia sin cambiarla.
 * @param {object} datos - Datos del formulario.
 * @param {string} datos.codigo - Codigo del equipo.
 * @param {string} datos.descripcion - Descripcion del equipo.
 * @param {string} [datos.estado] - Estado del equipo (opcional al crear).
 * @param {File} [datos.imagen] - Archivo de imagen seleccionado, si hay uno nuevo.
 * @returns {FormData} Formulario listo para enviar.
 */
function construirFormData({ codigo, descripcion, estado, imagen }) {
  const formData = new FormData();
  formData.append('codigo', codigo);
  formData.append('descripcion', descripcion);
  if (estado) formData.append('estado', estado);
  if (imagen instanceof File) formData.append('imagen', imagen);
  return formData;
}

/**
 * Construye la URL publica de la imagen de un equipo, o null si no tiene.
 * @param {string|null|undefined} nombreArchivo - Nombre de archivo guardado en el equipo.
 * @returns {string|null} URL absoluta de la imagen, o null.
 */
export function urlImagenEquipo(nombreArchivo) {
  if (!nombreArchivo) return null;
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}/uploads/equipos/${nombreArchivo}`;
}

/*
//////////////////////////////////////////////////////////
FUNCIONES DE API
//////////////////////////////////////////////////////////
*/

/**
 * Lista los equipos del inventario, con filtro opcional por estado.
 * @param {string} [estado] - Filtra por estado exacto (DISPONIBLE, PRESTADO, MANTENIMIENTO, INACTIVO).
 * @returns {Promise<{ok: boolean, data: Array<object>, message: string}>}
 */
export async function listarEquipos(estado = '') {
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
  return apiFetch(`/equipos${qs}`);
}

/**
 * Obtiene el detalle de un equipo por su id.
 * @param {number|string} id - Id del equipo.
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function obtenerEquipo(id) {
  return apiFetch(`/equipos/${id}`);
}

/**
 * Registra un nuevo equipo. La imagen es opcional.
 * @param {object} datos - { codigo, descripcion, estado, imagen }
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function crearEquipo(datos) {
  return apiFetch('/equipos', { method: 'POST', body: construirFormData(datos) });
}

/**
 * Actualiza un equipo existente. La imagen solo se reemplaza si se envia una nueva.
 * @param {number|string} id - Id del equipo a actualizar.
 * @param {object} datos - { codigo, descripcion, estado, imagen }
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function actualizarEquipo(id, datos) {
  return apiFetch(`/equipos/${id}`, { method: 'PUT', body: construirFormData(datos) });
}

/**
 * Cambia unicamente el estado de un equipo (no permite PRESTADO).
 * @param {number|string} id - Id del equipo.
 * @param {string} estado - Nuevo estado (DISPONIBLE, MANTENIMIENTO o INACTIVO).
 * @returns {Promise<{ok: boolean, data: object, message: string}>}
 */
export async function cambiarEstadoEquipo(id, estado) {
  return apiFetch(`/equipos/${id}/estado`, { method: 'PATCH', body: { estado } });
}

/**
 * Elimina un equipo del inventario.
 * @param {number|string} id - Id del equipo a eliminar.
 * @returns {Promise<{ok: boolean, data: null, message: string}>}
 */
export async function eliminarEquipo(id) {
  return apiFetch(`/equipos/${id}`, { method: 'DELETE' });
}
