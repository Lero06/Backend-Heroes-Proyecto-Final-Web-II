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
considerando cadenas de proxys (Vercel, Railway, Cloudflare, Nginx)
y comprobar si se encuentra dentro del rango de IP permitido
configurado en la base de datos (formato CIDR o IP exacta).
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
 * En cadenas como X-Forwarded-For: "201.192.10.45, 152.233.23.193", la PRIMERA IP
 * siempre pertenece al cliente real originario de la peticion.
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
function ipAEntero(ip) {
  const partes = ip.split('.').map(Number);
  if (partes.length !== 4 || partes.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((partes[0] << 24) | (partes[1] << 16) | (partes[2] << 8) | partes[3]) >>> 0;
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
