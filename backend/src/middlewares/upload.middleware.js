/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: upload.middleware.js
Autor: Jose Rodolfo Chaves Herrera
Fecha: 25/08/2026
Modulo: Inventario de Equipos (middleware reutilizable)
Descripcion:
Middleware generico de subida de imagenes basado en Multer. Genera un
nombre de archivo seguro y unico (evita sobrescribir archivos
existentes), valida el tipo de archivo (solo JPG/PNG/WEBP) y limita el
tamano maximo dinamicamente segun la tabla `configuracion` (clave `tamano_max_archivo_mb`).
Uso: router.post('/', subirImagen('imagen', 'equipos'), controlador);
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import pool from '../config/db.js';
import { error } from '../utils/response.js';

/*
//////////////////////////////////////////////////////////
CONFIGURACION
//////////////////////////////////////////////////////////
*/

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const EXTENSION_POR_TIPO = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Obtiene el tamano maximo de imagen en MB configurado en la base de datos.
 * @returns {Promise<number>} Limite en Megabytes.
 */
export async function obtenerMaxImagenMb() {
  try {
    const [rows] = await pool.query(
      "SELECT valor FROM configuracion WHERE clave = 'tamano_max_archivo_mb'"
    );
    if (rows.length > 0 && rows[0].valor) {
      const val = Number(rows[0].valor);
      if (!isNaN(val) && val > 0) return val;
    }
  } catch (err) {
    // Si falla la consulta, usar fallback de variable de entorno o default
  }
  return Number(process.env.MAX_IMAGEN_MB || 5);
}

/*
//////////////////////////////////////////////////////////
FUNCIONES AUXILIARES PRIVADAS
//////////////////////////////////////////////////////////
*/

/**
 * Crea (si no existe) la carpeta de destino y arma el storage de Multer
 * para esa carpeta, generando siempre un nombre de archivo aleatorio y
 * unico para evitar colisiones o sobrescritura de archivos existentes.
 * @param {string} carpetaDestino - Subcarpeta dentro de backend/uploads (ej. 'equipos').
 * @returns {import('multer').StorageEngine} Storage engine configurado.
 */
function crearAlmacenamiento(carpetaDestino) {
  const destino = path.resolve(process.cwd(), 'uploads', carpetaDestino);
  fs.mkdirSync(destino, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destino),
    filename: (req, file, cb) => {
      const extension = EXTENSION_POR_TIPO[file.mimetype] || path.extname(file.originalname).toLowerCase();
      // Nombre generado por el servidor (nunca el nombre original del
      // cliente): timestamp + bytes aleatorios, imposible de adivinar
      // o de hacer coincidir con un archivo ya existente.
      const nombreSeguro = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
      cb(null, nombreSeguro);
    },
  });
}

/**
 * Filtro de Multer: solo acepta imagenes JPG, PNG o WEBP.
 * @param {object} req - Request de Express.
 * @param {object} file - Metadatos del archivo recibido.
 * @param {Function} cb - Callback de Multer (error, aceptar).
 */
function filtroImagenes(req, file, cb) {
  if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
    const err = new Error('Formato de imagen no permitido. Use JPG, PNG o WEBP');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
}

/*
//////////////////////////////////////////////////////////
FUNCION PRINCIPAL (EXPORTADA)
//////////////////////////////////////////////////////////
*/

/**
 * Genera un middleware de Express listo para usar en una ruta, que
 * procesa un unico archivo de imagen enviado en el campo `campo` de un
 * formulario multipart/form-data, y lo guarda en `uploads/<carpetaDestino>`.
 * El limite de tamano se lee en tiempo real de la base de datos (`tamano_max_archivo_mb`).
 * @param {string} campo - Nombre del campo del formulario (ej. 'imagen').
 * @param {string} carpetaDestino - Subcarpeta de uploads donde guardar el archivo.
 * @returns {Function} Middleware de Express.
 */
function subirImagen(campo, carpetaDestino) {
  const storage = crearAlmacenamiento(carpetaDestino);

  return async (req, res, next) => {
    const maxMb = await obtenerMaxImagenMb();

    const upload = multer({
      storage,
      fileFilter: filtroImagenes,
      limits: { fileSize: maxMb * 1024 * 1024 },
    }).single(campo);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, `La imagen no debe superar ${maxMb}MB`, 400);
        }
        return error(res, 'No se pudo procesar el archivo enviado', 400);
      }
      if (err) {
        return error(res, err.message || 'Archivo invalido', err.status || 400);
      }
      next();
    });
  };
}

export default subirImagen;
