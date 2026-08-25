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
configuracion robusta de CORS para despliegue en Vercel + Railway,
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

// Confiar en los proxies de Railway / Vercel para procesar HTTPS e IPs correctamente
app.set('trust proxy', 1);

// Configuracion de CORS robusta para despliegues cruzados (Vercel <-> Railway)
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (ej. Postman o solicitudes server-to-server)
    if (!origin) return callback(null, true);

    // En desarrollo o desplegado en Vercel (*.vercel.app), permitir la conexion con credenciales
    if (
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
    ) {
      return callback(null, true);
    }

    // Por defecto permitir el origin recibido para evitar bloqueos
    return callback(null, true);
  },
  credentials: true, // Requerido para cookies HttpOnly (sid, dispositivo_id)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-device-id'],
};

// El middleware cors() ya responde automaticamente a las solicitudes
// preflight OPTIONS para todas las rutas; NO se necesita (ni se debe usar)
// app.options('*', cors(corsOptions)) porque el patron '*' como ruta
// hace que path-to-regexp lance una excepcion al arrancar en versiones
// recientes de Express/path-to-regexp, tumbando el proceso antes de
// que llegue a escuchar en el puerto (causa raiz del 502 "Application
// failed to respond" en Railway).
app.use(cors(corsOptions));

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