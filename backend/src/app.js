/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: app.js
Autor: Leandro Sanchez Rojas / Adaptado a ESM y actualizado por Marco Vásquez
Fecha: 22/08/2026
Modulo: Arquitectura Base
Descripcion:
Configuracion central de la aplicacion Express: middlewares globales,
montaje de las rutas de cada modulo (incluidos Marcas y Dispositivos) y
manejador de errores centralizado.
Adaptado a ES Modules (import/export).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import manejadorErrores from './middlewares/error.middleware.js';
import marcasRoutes from './modules/marcas/marcas.routes.js';
import dispositivosRoutes from './modules/dispositivos/dispositivos.routes.js';

/*
//////////////////////////////////////////////////////////
CONFIGURACION DE LA APP
//////////////////////////////////////////////////////////
*/

const app = express();

app.use(cors({ origin: true, credentials: true })); // credentials: true para permitir cookies de sesion y dispositivos
app.use(express.json());
app.use(cookieParser());

/*
//////////////////////////////////////////////////////////
RUTAS DE CADA MODULO
//////////////////////////////////////////////////////////
*/

// Rutas del Modulo 2: Marcas y Dispositivos (Marco Vásquez)
app.use('/api/dispositivos', dispositivosRoutes);
app.use('/api/marcas', marcasRoutes);

// Rutas de otros integrantes (se descomentan conforme las agreguen):
// app.use('/api/auth', authRoutes);
// app.use('/api/departamentos', departamentosRoutes);
// app.use('/api/usuarios', usuariosRoutes);
// app.use('/api/reportes', reportesRoutes);
// app.use('/api/equipos', equiposRoutes);
// app.use('/api/prestamos', prestamosRoutes);
// app.use('/api/configuracion', configuracionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, data: null, message: 'API activa' });
});

/*
//////////////////////////////////////////////////////////
MANEJO DE ERRORES (SIEMPRE AL FINAL)
//////////////////////////////////////////////////////////
*/

app.use(manejadorErrores);

export default app;
