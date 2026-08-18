/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: reportes.js
Autor: Gloriana Carrillo Alfaro
Fecha: 18/08/2026
Modulo: Frontend - Reportes
Descripcion:
Capa de acceso a la API del modulo de reportes. Expone funciones para
consultar el reporte en formato JSON (via apiFetch, con cookies de
sesion automaticas) y para disparar las descargas de exportacion en
JSON, XML y PDF (via window.open, ya que son respuestas binarias/texto
con Content-Disposition: attachment, no respuestas JSON estandar).
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
 * Construye un query string a partir de un objeto de filtros,
 * omitiendo las claves cuyo valor sea vacio (''), null o undefined.
 * @param {object} filtros - Objeto de filtros { usuario, anio, mes, dia, departamento }.
 * @returns {string} Query string sin el '?' inicial (puede ser vacio).
 */
function construirQueryString(filtros) {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== '' && valor !== null && valor !== undefined) {
      params.append(clave, valor);
    }
  }
  return params.toString();
}

/*
//////////////////////////////////////////////////////////
FUNCIONES DE API
//////////////////////////////////////////////////////////
*/

/**
 * Obtiene el reporte de marcas filtrado en formato JSON estandar de la API.
 * Utiliza apiFetch para incluir automaticamente las cookies de sesion.
 * @param {object} [filtros={}] - Filtros opcionales { usuario, anio, mes, dia, departamento }.
 * @returns {Promise<{ok: boolean, data: Array<object>, message: string}>}
 */
export async function obtenerReporte(filtros = {}) {
  const qs = construirQueryString(filtros);
  const path = qs ? `/reportes?${qs}` : '/reportes';
  return apiFetch(path);
}

/**
 * Inicia la descarga del reporte en formato JSON.
 * Abre la URL en una nueva pestana; la cookie de sesion se envia
 * automaticamente porque es la misma sesion del navegador.
 * @param {object} [filtros={}] - Filtros opcionales { usuario, anio, mes, dia, departamento }.
 */
export function exportarReporteJSON(filtros = {}) {
  const qs = construirQueryString(filtros);
  const url = `${API_URL}/reportes/exportar/json${qs ? `?${qs}` : ''}`;
  window.open(url, '_blank');
}

/**
 * Inicia la descarga del reporte en formato XML.
 * @param {object} [filtros={}] - Filtros opcionales { usuario, anio, mes, dia, departamento }.
 */
export function exportarReporteXML(filtros = {}) {
  const qs = construirQueryString(filtros);
  const url = `${API_URL}/reportes/exportar/xml${qs ? `?${qs}` : ''}`;
  window.open(url, '_blank');
}

/**
 * Inicia la descarga del reporte en formato PDF.
 * @param {object} [filtros={}] - Filtros opcionales { usuario, anio, mes, dia, departamento }.
 */
export function exportarReportePDF(filtros = {}) {
  const qs = construirQueryString(filtros);
  const url = `${API_URL}/reportes/exportar/pdf${qs ? `?${qs}` : ''}`;
  window.open(url, '_blank');
}
