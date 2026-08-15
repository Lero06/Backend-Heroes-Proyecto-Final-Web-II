/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: client.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - API
Descripcion:
Cliente centralizado para hablar con el backend. Todos los fetch()
del proyecto deben pasar por aqui, para no repetir la base URL, las
credenciales (cookies de sesion) ni el manejo del formato estandar
de respuesta { ok, data, message } en cada componente.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/*
//////////////////////////////////////////////////////////
FUNCION PRINCIPAL
//////////////////////////////////////////////////////////
*/

/**
 * Realiza una peticion al backend y devuelve directamente el cuerpo
 * ya parseado ({ ok, data, message }). Siempre incluye las cookies
 * de sesion (credentials: 'include'), imprescindible porque el
 * backend usa cookies HttpOnly para la sesion, no tokens en headers.
 * @param {string} path - Ruta relativa (ej. '/auth/login').
 * @param {object} [opciones] - Opciones adicionales de fetch.
 * @param {string} [opciones.method='GET'] - Metodo HTTP.
 * @param {object} [opciones.body] - Cuerpo de la peticion (se serializa a JSON).
 * @returns {Promise<{ok: boolean, data: any, message: string}>} Cuerpo de la respuesta ya parseado.
 */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const respuesta = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include', // manda/recibe la cookie "sid"
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const cuerpo = await respuesta.json().catch(() => ({
    ok: false,
    data: null,
    message: 'Respuesta invalida del servidor',
  }));

  return cuerpo;
}
