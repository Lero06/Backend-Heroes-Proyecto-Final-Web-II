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
consultar el reporte filtrado y exportar en JSON, XML y PDF.
JSON y XML se generan directamente en el cliente (Blob) con las filas
ya cargadas; PDF se genera en el backend mediante pdfkit.
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
 * Escapa caracteres especiales para evitar XML mal formado.
 * @param {*} str
 * @returns {string}
 */
function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Dispara la descarga de un Blob como archivo en el navegador.
 * @param {Blob} blob
 * @param {string} nombre
 */
function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta las filas recibidas como archivo JSON directamente en el cliente.
 * @param {object[]} filas - Registros a exportar.
 * @param {{ empresa: string, generado_por: string }} meta - Metadatos del informe.
 */
export function exportarReporteJSON(filas, meta) {
  const datos = filas.map((f) => ({
    id: f.id,
    usuario_id: f.usuario_id,
    nombre_completo: f.nombre_completo,
    departamento: f.departamento ?? '',
    fecha: f.fecha ? String(f.fecha).slice(0, 10) : '',
    hora: f.hora ?? '',
    tipo: f.tipo ?? '',
    dispositivo: f.dispositivo_nombre ?? '',
    ip: f.ip ?? '',
  }));

  const payload = {
    empresa: meta.empresa || 'Universidad Técnica Nacional',
    generado_por: meta.generado_por || '',
    fecha_generacion: new Date().toISOString(),
    total_registros: datos.length,
    registros: datos,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  descargarBlob(blob, `reporte_marcas_${Date.now()}.json`);
}

/**
 * Exporta las filas recibidas como archivo XML directamente en el cliente.
 * @param {object[]} filas - Registros a exportar.
 * @param {{ empresa: string, generado_por: string }} meta - Metadatos del informe.
 */
export function exportarReporteXML(filas, meta) {
  const empresa    = meta.empresa || 'Universidad Técnica Nacional';
  const generador  = meta.generado_por || '';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<reporteMarcas empresa="${escapeXml(empresa)}" generado_por="${escapeXml(generador)}" generado_en="${new Date().toISOString()}" total_registros="${filas.length}">\n`;

  for (const f of filas) {
    xml += `  <marca>\n`;
    xml += `    <id>${f.id ?? ''}</id>\n`;
    xml += `    <usuario_id>${f.usuario_id ?? ''}</usuario_id>\n`;
    xml += `    <nombre_completo>${escapeXml(f.nombre_completo)}</nombre_completo>\n`;
    xml += `    <departamento>${escapeXml(f.departamento ?? '')}</departamento>\n`;
    xml += `    <fecha>${f.fecha ? String(f.fecha).slice(0, 10) : ''}</fecha>\n`;
    xml += `    <hora>${f.hora ?? ''}</hora>\n`;
    xml += `    <tipo>${f.tipo ?? ''}</tipo>\n`;
    xml += `    <dispositivo>${escapeXml(f.dispositivo_nombre ?? '')}</dispositivo>\n`;
    xml += `    <ip>${f.ip ?? ''}</ip>\n`;
    xml += `  </marca>\n`;
  }

  xml += `</reporteMarcas>`;

  const blob = new Blob([xml], { type: 'application/xml; charset=utf-8' });
  descargarBlob(blob, `reporte_marcas_${Date.now()}.xml`);
}

/**
 * Inicia la descarga del reporte en formato PDF desde el backend.
 * Si se proporcionan ids (array de numeros), solo exporta esas marcas.
 * @param {object} [filtros={}] - Filtros opcionales.
 * @param {number[]|null} [ids=null] - IDs de marcas a exportar (null = todas).
 */
export async function exportarReportePDF(filtros = {}, ids = null) {
  const filtrosConIds = ids && ids.length > 0
    ? { ...filtros, ids: ids.join(',') }
    : filtros;
  return descargarArchivo('pdf', filtrosConIds, `reporte_marcas_${Date.now()}.pdf`);
}
