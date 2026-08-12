// Validaciones de formato/presencia para el registro.
// Las reglas de negocio (correo/usuario duplicado, confirmacion de
// contrasena) se revisan en el controlador porque necesitan consultar
// la base de datos o comparar varios campos entre si.

const esquemaRegistro = {
  nombre_completo: (v) => typeof v === 'string' && v.trim().length >= 3,
  fecha_nacimiento: (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v),
  correo: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  departamento_id: (v) => v !== undefined && v !== null && Number.isInteger(Number(v)),
  usuario: (v) => typeof v === 'string' && /^[a-zA-Z0-9_.]{3,30}$/.test(v),
  password: (v) => typeof v === 'string' && v.length >= 8,
  confirmar_password: (v) => typeof v === 'string' && v.length >= 8,
};

const esquemaLogin = {
  identificador: (v) => typeof v === 'string' && v.trim().length > 0, // usuario o correo
  password: (v) => typeof v === 'string' && v.length > 0,
};

module.exports = { esquemaRegistro, esquemaLogin };
