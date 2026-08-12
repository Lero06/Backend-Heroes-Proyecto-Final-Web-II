/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: app.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Arquitectura Base
Descripcion:
Configuracion central de la aplicacion Express: middlewares globales,
montaje de las rutas de cada modulo y manejador de errores. Cada
integrante del equipo agrega aqui su propio router cuando lo tenga listo.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const manejadorErrores = require('./middlewares/error.middleware');

/*
//////////////////////////////////////////////////////////
CONFIGURACION DE LA APP
//////////////////////////////////////////////////////////
*/

const app = express();

app.use(cors({ origin: true, credentials: true })); // credentials: true porque usamos cookies de sesion
app.use(express.json());
app.use(cookieParser());

/*
//////////////////////////////////////////////////////////
RUTAS DE CADA MODULO
//////////////////////////////////////////////////////////
*/

// Cada integrante monta su modulo aqui cuando lo tenga listo:
app.use('/api/auth', require('./modules/auth/auth.routes'));
// app.use('/api/usuarios', require('./modules/usuarios/usuarios.routes'));
// app.use('/api/marcas', require('./modules/marcas/marcas.routes'));
// app.use('/api/equipos', require('./modules/equipos/equipos.routes'));
// app.use('/api/prestamos', require('./modules/prestamos/prestamos.routes'));
// app.use('/api/configuracion', require('./modules/configuracion/configuracion.routes'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, data: null, message: 'API activa' });
});

/*
//////////////////////////////////////////////////////////
MANEJO DE ERRORES (SIEMPRE AL FINAL)
//////////////////////////////////////////////////////////
*/

app.use(manejadorErrores);

module.exports = app;
