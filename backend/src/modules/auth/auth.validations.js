/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: auth.validations.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Autenticacion y Usuarios
Descripcion:
Esquemas de validacion de formato/presencia para los endpoints del
modulo de autenticacion (registro y login). Las reglas de negocio que
necesitan consultar la base de datos o comparar varios campos entre si
(correo/usuario duplicado, confirmacion de contrasena) se revisan en
el controlador, no aqui.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
ESQUEMAS DE VALIDACION
//////////////////////////////////////////////////////////
*/

/**
 * Esquema de validacion para el registro de un nuevo usuario.
 * Cada funcion recibe el valor del campo y retorna true/false.
 */
const esquemaRegistro = {
  nombre_completo: (v) => typeof v === 'string' && v.trim().length >= 3,
  fecha_nacimiento: (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v),
  correo: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  departamento_id: (v) => v !== undefined && v !== null && Number.isInteger(Number(v)),
  usuario: (v) => typeof v === 'string' && /^[a-zA-Z0-9_.]{3,30}$/.test(v),
  password: (v) => typeof v === 'string' && v.length >= 8,
  confirmar_password: (v) => typeof v === 'string' && v.length >= 8,
};

/**
 * Esquema de validacion para el inicio de sesion.
 * `identificador` acepta usuario o correo, segun pide la guia del proyecto.
 */
const esquemaLogin = {
  identificador: (v) => typeof v === 'string' && v.trim().length > 0,
  password: (v) => typeof v === 'string' && v.length > 0,
};

module.exports = { esquemaRegistro, esquemaLogin };
