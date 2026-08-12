/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: usuarios.validations.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Usuarios (Perfil)
Descripcion:
Esquema de validacion para la edicion del perfil del usuario. Solo
cubre los campos que la guia permite modificar directamente: nombre,
fecha de nacimiento y departamento. Correo y usuario no se incluyen
aqui porque no son editables desde este endpoint.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
ESQUEMAS DE VALIDACION
//////////////////////////////////////////////////////////
*/

/**
 * Esquema de validacion para actualizar el perfil propio.
 */
const esquemaActualizarPerfil = {
  nombre_completo: (v) => typeof v === 'string' && v.trim().length >= 3,
  fecha_nacimiento: (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v),
  departamento_id: (v) => v !== undefined && v !== null && Number.isInteger(Number(v)),
};

module.exports = { esquemaActualizarPerfil };
