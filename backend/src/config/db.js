/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: db.js
Autor: Leandro Sanchez Rojas / Adaptado a ESM por Marco Vásquez
Fecha: 22/08/2026
Modulo: Configuracion / Base de Datos
Descripcion:
Pool de conexiones a MySQL utilizado por todos los modulos del
backend. Centraliza la configuracion de conexion leida desde las
variables de entorno para que ningun modulo abra conexiones propias.
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

import mysql from 'mysql2/promise';

/*
//////////////////////////////////////////////////////////
CONFIGURACION DEL POOL
//////////////////////////////////////////////////////////
*/

/**
 * Pool de conexiones reutilizable hacia MySQL.
 * Todos los modelos del proyecto deben importar este pool en lugar
 * de crear conexiones individuales con mysql.createConnection().
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3308),
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'app_password_segura',
  database: process.env.DB_NAME || 'marcas_equipos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
