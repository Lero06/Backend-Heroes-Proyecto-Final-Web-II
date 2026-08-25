/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: ip.util.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Marcas y Dispositivos / Utilidades de Red
Descripcion:
Helper para extraer y normalizar la direccion IP real del cliente
considerando cadenas de proxys (Vercel, Railway, Cloudflare, Nginx),
validar la sintaxis de IP / CIDR y comprobar si se encuentra dentro
del rango de IP permitido configurado en la base de datos.
//////////////////////////////////////////////////////////
*/

/**
 * Normaliza una direccion IP entregada por Express o proxys.
 * Remueve el prefijo '::ffff:' de IPv4 mapeadas en IPv6 y convierte '::1' a '127.0.0.1'.
 * @param {string} ip - IP cruda obtenida del request.
 * @returns {string} IP limpia en notacion IPv4 estandar.
 */
export function normalizarIp(ip) {
  if (!ip) return '127.0.0.1';
  let limpia = String(ip).trim();
  if (limpia.startsWith('::ffff:')) {
    limpia = limpia.replace('::ffff:', '');
  }
  if (limpia === '::1' || limpia === 'localhost') {
    limpia = '127.0.0.1';
  }
  return limpia;
}

/**
 * Extrae la IP real del cliente final inspeccionando la cadena de encabezados de proxys.
 * @param {object} req - Objeto Request de Express.
 * @returns {string} IP limpia del cliente real.
 */
export function extraerIpCliente(req) {
  let rawIp =
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-client-ip'];

  if (!rawIp && req.headers['x-forwarded-for']) {
    const listaFwd = String(req.headers['x-forwarded-for']).split(',');
    rawIp = listaFwd[0].trim();
  }

  if (!rawIp) {
    rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }

  return normalizarIp(rawIp);
}

/**
 * Convierte una direccion IPv4 en un numero entero sin signo de 32 bits.
 * @param {string} ip - IP en notacion decimal con puntos (ej. '192.168.1.10').
 * @returns {number|null} Entero de 32 bits o null si el formato no es valido.
 */
export function ipAEntero(ip) {
  if (!ip || typeof ip !== 'string') return null;
  const partes = ip.split('.');
  if (partes.length !== 4) return null;

  for (const parte of partes) {
    if (!/^\d+$/.test(parte)) return null;
    const num = Number(parte);
    if (num < 0 || num > 255) return null;
    if (parte.length > 1 && parte.startsWith('0')) return null; // Evitar ceros a la izquierda ambiguos (ej. 01)
  }

  const nums = partes.map(Number);
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}

/**
 * Valida si una cadena de texto representa una IP IPv4 individual o notacion CIDR valida.
 * Soporta listas separadas por coma (ej. "0.0.0.0/0", "192.168.1.15", "192.168.1.0/24").
 * @param {string} rangoConfigurado - Cadena de IP o rango CIDR a validar.
 * @returns {boolean} true si el formato es completamente valido.
 */
export function validarFormatoRangoIp(rangoConfigurado) {
  if (!rangoConfigurado || typeof rangoConfigurado !== 'string') return false;
  const texto = rangoConfigurado.trim();
  if (!texto) return false;

  const rangos = texto.split(',').map((r) => r.trim());

  for (const rango of rangos) {
    if (rango === '0.0.0.0/0' || rango === '*') continue;

    if (rango.includes('/')) {
      const partes = rango.split('/');
      if (partes.length !== 2) return false;
      const [ipBase, mascaraStr] = partes;
      if (!/^\d+$/.test(mascaraStr)) return false;

      const mascara = parseInt(mascaraStr, 10);
      if (isNaN(mascara) || mascara < 0 || mascara > 32) return false;

      if (ipAEntero(ipBase) === null) return false;
    } else {
      if (ipAEntero(rango) === null && rango !== '::1' && rango !== 'localhost') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Verifica si una IP especifica pertenece a una subred CIDR (ej. 192.168.1.0/24).
 * @param {string} ipCliente - IP limpia a verificar.
 * @param {string} cidr - Rango en formato CIDR (ej. 192.168.1.0/24).
 * @returns {boolean} true si pertenece a la subred.
 */
function perteneceACidr(ipCliente, cidr) {
  const [ipBase, mascaraStr] = cidr.split('/');
  const mascara = parseInt(mascaraStr, 10);

  if (isNaN(mascara) || mascara < 0 || mascara > 32) return false;
  if (mascara === 0) return true; // 0.0.0.0/0 permite cualquier IP

  const clienteInt = ipAEntero(ipCliente);
  const baseInt = ipAEntero(ipBase);

  if (clienteInt === null || baseInt === null) return false;

  const mascaraInt = (~0 << (32 - mascara)) >>> 0;
  return (clienteInt & mascaraInt) === (baseInt & mascaraInt);
}

/**
 * Comprueba si la IP del cliente esta autorizada segun el rango o lista de rangos configurados.
 * @param {string} ipClienteRaw - IP recibida o extraida del cliente.
 * @param {string} rangoConfigurado - Rango o IP de la BD (ej. '0.0.0.0/0', '192.168.1.0/24', '127.0.0.1').
 * @returns {boolean} true si la IP esta dentro de los rangos permitidos.
 */
export function esIpPermitida(ipClienteRaw, rangoConfigurado) {
  const ipCliente = normalizarIp(ipClienteRaw);

  if (!rangoConfigurado || rangoConfigurado.trim() === '0.0.0.0/0' || rangoConfigurado.trim() === '*') {
    return true;
  }

  const rangos = rangoConfigurado.split(',').map((r) => r.trim());

  for (const rango of rangos) {
    if (rango === '0.0.0.0/0' || rango === '*') {
      return true;
    }

    if (rango.includes('/')) {
      if (perteneceACidr(ipCliente, rango)) return true;
    } else {
      const ipRangoNormalizada = normalizarIp(rango);
      if (ipCliente === ipRangoNormalizada) return true;
    }
  }

  return false;
}
