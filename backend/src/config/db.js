/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: db.js
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Configuracion / Base de Datos
Descripcion:
Pool de conexiones a MySQL utilizado por todos los modulos del
backend. Centraliza la configuracion de conexion leida desde las
variables de entorno para que ningun modulo abra conexiones propias.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import 'dotenv/config';
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
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
