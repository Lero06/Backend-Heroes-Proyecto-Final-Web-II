/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: reportes.js
Autor: Gloriana Carrillo Alfaro
Fecha: 24/08/2026
Modulo: Frontend - Reportes
Descripcion:
Capa de acceso a la API del modulo de reportes. Expone funciones para
consultar el reporte en formato JSON y para descargar las exportaciones
en JSON, XML y PDF directamente mediante peticiones fetch asincronas
con credenciales, generando la descarga en el cliente sin abandonar la aplicacion.
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

/**
 * Descarga un archivo directamente en el navegador sin abrir nuevas pestañas.
 * @param {string} endpoint - Endpoint de exportacion relativo a /api/reportes.
 * @param {object} filtros - Filtros aplicados.
 * @param {string} nombreArchivoPredeterminado - Nombre del archivo en caso de no venir en encabezados.
 */
async function descargarArchivo(endpoint, filtros, nombreArchivoPredeterminado) {
  const qs = construirQueryString(filtros);
  const url = `${API_URL}/reportes/exportar/${endpoint}${qs ? `?${qs}` : ''}`;

  const respuesta = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!respuesta.ok) {
    const errorJson = await respuesta.json().catch(() => null);
    throw new Error(errorJson?.message || `Error ${respuesta.status} al exportar reporte`);
  }

  // Obtener el nombre del archivo del header Content-Disposition si existe
  const disposition = respuesta.headers.get('Content-Disposition');
  let nombreDescarga = nombreArchivoPredeterminado;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      nombreDescarga = match[1];
    }
  }

  const blob = await respuesta.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = nombreDescarga;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
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
 * Inicia la descarga del reporte en formato JSON directamente en el cliente.
 * @param {object} [filtros={}] - Filtros opcionales.
 */
export async function exportarReporteJSON(filtros = {}) {
  return descargarArchivo('json', filtros, `reporte_marcas_${Date.now()}.json`);
}

/**
 * Inicia la descarga del reporte en formato XML directamente en el cliente.
 * @param {object} [filtros={}] - Filtros opcionales.
 */
export async function exportarReporteXML(filtros = {}) {
  return descargarArchivo('xml', filtros, `reporte_marcas_${Date.now()}.xml`);
}

/**
 * Inicia la descarga del reporte en formato PDF directamente en el cliente.
 * @param {object} [filtros={}] - Filtros opcionales.
 */
export async function exportarReportePDF(filtros = {}) {
  return descargarArchivo('pdf', filtros, `reporte_marcas_${Date.now()}.pdf`);
}
