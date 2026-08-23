/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: equipos.validations.js
Autor: Jose Rodolfo Chaves Herrera
Fecha: 22/08/2026
Modulo: Inventario de Equipos
Descripcion:
Esquemas de validacion de formato/presencia para los endpoints del
modulo de inventario de equipos. La verificacion de codigo duplicado
(que requiere consultar la base de datos) se revisa en el
controlador, no aqui.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

/**
 * Estados validos para un equipo, segun la guia del proyecto.
 */
const ESTADOS_VALIDOS = ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'INACTIVO'];

/*
//////////////////////////////////////////////////////////
ESQUEMAS DE VALIDACION
//////////////////////////////////////////////////////////
*/

/**
 * Esquema de validacion para registrar un nuevo equipo.
 * Se usa sobre req.body cuando la peticion llega como multipart/form-data
 * (el middleware de subida de imagenes deja los campos de texto en req.body
 * igual que con JSON normal).
 */
const esquemaCrearEquipo = {
  codigo: (v) => typeof v === 'string' && /^[a-zA-Z0-9_-]{2,50}$/.test(v.trim()),
  descripcion: (v) => typeof v === 'string' && v.trim().length >= 3 && v.trim().length <= 255,
};

/**
 * Esquema de validacion para actualizar un equipo existente.
 * El estado es opcional en el body porque puede venir o no segun el
 * formulario; si viene, debe ser uno de los estados validos.
 */
const esquemaActualizarEquipo = {
  codigo: (v) => typeof v === 'string' && /^[a-zA-Z0-9_-]{2,50}$/.test(v.trim()),
  descripcion: (v) => typeof v === 'string' && v.trim().length >= 3 && v.trim().length <= 255,
  estado: (v) => typeof v === 'string' && ESTADOS_VALIDOS.includes(v),
};

/**
 * Esquema de validacion para cambiar unicamente el estado de un equipo.
 */
const esquemaCambiarEstado = {
  estado: (v) => typeof v === 'string' && ESTADOS_VALIDOS.includes(v),
};

export { ESTADOS_VALIDOS, esquemaCrearEquipo, esquemaActualizarEquipo, esquemaCambiarEstado };
