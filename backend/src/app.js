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
configuracion universal de CORS (origin: true, credentials: true),
montaje de las rutas de cada modulo y manejador de errores centralizado.
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
import path from 'path';
import { fileURLToPath } from 'url';

import manejadorErrores from './middlewares/error.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import departamentosRoutes from './modules/departamentos/departamentos.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import reportesRoutes from './modules/reportes/reportes.routes.js';
import equiposRoutes from './modules/equipos/equipos.routes.js';
import marcasRoutes from './modules/marcas/marcas.routes.js';
import dispositivosRoutes from './modules/dispositivos/dispositivos.routes.js'
import prestamosRoutes from './modules/prestamos/prestamos.routes.js';
import configuracionRoutes from './modules/configuracion/configuracion.routes.js';

/*
//////////////////////////////////////////////////////////
CONFIGURACION DE LA APP Y PROXY
//////////////////////////////////////////////////////////
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Confiar en los proxies de la nube (Railway/Render)
app.set('trust proxy', 1);

// CORS universal: refleja automaticamente el origin recibidos y permite credenciales
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
app.use(cookieParser());

// ============================================================
// MIDDLEWARE PARA SERVIR ARCHIVOS ESTÁTICOS (IMÁGENES DE EQUIPOS)
// ============================================================
// Exponer la carpeta 'uploads' en la ruta '/uploads' para que las imágenes
// sean accesibles desde el frontend.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/*
//////////////////////////////////////////////////////////
RUTAS DE CADA MODULO
//////////////////////////////////////////////////////////
*/

app.use('/api/auth', authRoutes);
app.use('/api/departamentos', departamentosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/dispositivos', dispositivosRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/configuracion', configuracionRoutes);

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