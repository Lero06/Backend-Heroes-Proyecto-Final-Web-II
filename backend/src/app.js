require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const manejadorErrores = require('./middlewares/error.middleware');

const app = express();

app.use(cors({ origin: true, credentials: true })); // credentials: true porque usamos cookies
app.use(express.json());
app.use(cookieParser());

// Cada integrante monta su módulo aquí cuando lo tenga listo:
app.use('/api/auth', require('./modules/auth/auth.routes'));
// app.use('/api/usuarios', require('./modules/usuarios/usuarios.routes'));
// app.use('/api/marcas', require('./modules/marcas/marcas.routes'));
// app.use('/api/equipos', require('./modules/equipos/equipos.routes'));
// app.use('/api/prestamos', require('./modules/prestamos/prestamos.routes'));
// app.use('/api/configuracion', require('./modules/configuracion/configuracion.routes'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, data: null, message: 'API activa' });
});

// SIEMPRE al final, después de todas las rutas
app.use(manejadorErrores);

module.exports = app;
