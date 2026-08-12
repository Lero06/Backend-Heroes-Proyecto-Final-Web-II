const bcrypt = require('bcryptjs');
const { ok, error } = require('../../utils/response');
const authModel = require('./auth.model');

const SALT_ROUNDS = 10;
const ROL_POR_DEFECTO = 'usuario';

async function registrar(req, res, next) {
  try {
    const {
      nombre_completo,
      fecha_nacimiento,
      correo,
      departamento_id,
      usuario,
      password,
      confirmar_password,
    } = req.body;

    // Regla de negocio: confirmacion de contrasena (no lo cubre el
    // validate.middleware porque compara dos campos entre si)
    if (password !== confirmar_password) {
      return error(res, 'La contrasena y su confirmacion no coinciden', 400);
    }

    // Regla de negocio: correo y usuario unicos (requiere consultar la BD)
    const [correoExistente, usuarioExistente] = await Promise.all([
      authModel.buscarPorCorreo(correo),
      authModel.buscarPorUsuario(usuario),
    ]);

    if (correoExistente) return error(res, 'El correo ya esta registrado', 409);
    if (usuarioExistente) return error(res, 'El nombre de usuario ya esta registrado', 409);

    const rolId = await authModel.obtenerRolIdPorNombre(ROL_POR_DEFECTO);
    if (!rolId) return error(res, 'No se encontro el rol por defecto en la base de datos', 500);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const nuevoId = await authModel.crearUsuario({
      nombre_completo,
      fecha_nacimiento,
      correo,
      usuario,
      password_hash: passwordHash,
      departamento_id,
      rol_id: rolId,
    });

    // Nunca se devuelve el password_hash en la respuesta
    return ok(res, { id: nuevoId, usuario, correo }, 'Usuario registrado correctamente', 201);
  } catch (err) {
    next(err); // lo captura error.middleware.js
  }
}

module.exports = { registrar };
