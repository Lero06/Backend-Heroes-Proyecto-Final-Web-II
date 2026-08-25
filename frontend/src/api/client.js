/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: client.js
Autor: Leandro Sanchez Rojas / Marco Vásquez
Fecha: 12/08/2026
Modulo: Frontend - API
Descripcion:
Cliente centralizado para hablar con el backend. Todos los fetch()
del proyecto deben pasar por aqui, para no repetir la base URL, las
credenciales (cookies de sesion) ni el manejo del formato estandar
de respuesta { ok, data, message } en cada componente.
Deteccion dinamica de IP local para pruebas en red Wi-Fi LAN.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_URL = import.meta.env.VITE_API_URL || `http://${defaultHost}:4000/api`;

/*
//////////////////////////////////////////////////////////
FUNCION PRINCIPAL
//////////////////////////////////////////////////////////
*/

/**
 * Realiza una peticion al backend y devuelve directamente el cuerpo
 * ya parseado ({ ok, data, message }). Siempre incluye las cookies
 * de sesion (credentials: 'include').
 * @param {string} path - Ruta relativa (ej. '/auth/login').
 * @param {object} [opciones] - Opciones adicionales de fetch.
 * @param {string} [opciones.method='GET'] - Metodo HTTP.
 * @param {object} [opciones.body] - Cuerpo de la peticion.
 * @returns {Promise<{ok: boolean, data: any, message: string}>} Cuerpo de la respuesta parseado.
 */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const respuesta = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include', // manda/recibe la cookie "sid"
    headers: body && !esFormData ? { 'Content-Type': 'application/json' } : undefined,
    body: esFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const cuerpo = await respuesta.json().catch(() => ({
    ok: false,
    data: null,
    message: 'Respuesta invalida del servidor',
  }));

  return cuerpo;
}
