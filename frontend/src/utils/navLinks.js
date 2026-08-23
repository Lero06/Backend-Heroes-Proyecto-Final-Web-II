/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: navLinks.js
Autor: Jose Rodolfo Chaves Herrera
Fecha: 23/08/2026
Modulo: Frontend - Navegacion compartida
Descripcion:
Fuente unica de la lista de enlaces del Navbar. Antes cada pagina
armaba su propio arreglo `links` a mano (Reportes.jsx, Equipos.jsx,
etc.), asi que cuando se agregaba un modulo nuevo habia que acordarse
de tocar TODAS las paginas para que el link apareciera en todas
partes. Con esto, cada pagina solo llama a obtenerLinksNav(usuario,
rutaActual) y listo: agregar un modulo nuevo (Marcas, Prestamos)
significa editar UNICAMENTE este archivo.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
CONFIGURACION DE MODULOS
//////////////////////////////////////////////////////////
*/

/**
 * Lista maestra de modulos navegables de la aplicacion.
 * `roles: null` significa visible para cualquier usuario autenticado.
 */
const MODULOS = [
  { texto: 'Inicio', url: '/', roles: null },
  { texto: 'Equipos', url: '/equipos', roles: null },
  { texto: 'Reportes', url: '/reportes', roles: ['administrador'] },
  { texto: 'Mi Perfil', url: '/perfil', roles: null },
  { texto: 'Marcas', url: '/marcas', roles: null },
  // { texto: 'Prestamos', url: '/prestamos', roles: null },
];

/*
//////////////////////////////////////////////////////////
FUNCION PRINCIPAL
//////////////////////////////////////////////////////////
*/

/**
 * Devuelve los enlaces de navegacion visibles para el usuario actual,
 * ya listos para pasarle directamente al prop `links` de <Navbar>.
 * @param {object|null} usuario - Usuario autenticado (usuario.rol se usa para filtrar).
 * @param {string} [rutaActual] - Ruta de la pagina actual, para marcar el link activo.
 * @returns {Array<{texto: string, url: string, active: boolean}>}
 */
export function obtenerLinksNav(usuario, rutaActual = '') {
  if (!usuario) return [];

  return MODULOS.filter((modulo) => !modulo.roles || modulo.roles.includes(usuario.rol)).map(
    (modulo) => ({
      texto: modulo.texto,
      url: modulo.url,
      active: modulo.url === rutaActual,
    })
  );
}
