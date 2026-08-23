/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: marcas.controller.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Marcas (Entrada/Salida)
Descripcion:
Logica de negocio para el registro de marcas de asistencia (ENTRADA/SALIDA).
Valida el rango de IP autorizada en la base de datos, valida el dispositivo
autorizado en estado ACTIVO, alterna automaticamente entre ENTRADA y SALIDA
evitando marcas inconsistentes, y calcula la duracion laborada.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { ok, error } from '../../utils/response.js';
import { normalizarIp, esIpPermitida } from '../../utils/ip.util.js';
import * as marcasModel from './marcas.model.js';
import * as dispositivosModel from '../dispositivos/dispositivos.model.js';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const DEVICE_COOKIE = 'dispositivo_id';

/*
//////////////////////////////////////////////////////////
FUNCIONES AUXILIARES DE TIEMPO
//////////////////////////////////////////////////////////
*/

/**
 * Formatea una fecha en formato YYYY-MM-DD local.
 * @param {Date} date - Objeto fecha.
 * @returns {string} Fecha en texto YYYY-MM-DD.
 */
function obtenerFechaActualTexto(date = new Date()) {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Formatea una hora en formato HH:MM:SS local.
 * @param {Date} date - Objeto fecha.
 * @returns {string} Hora en texto HH:MM:SS.
 */
function obtenerHoraActualTexto(date = new Date()) {
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');
  return `${horas}:${minutos}:${segundos}`;
}

/**
 * Calcula la duracion transcurrida entre una hora de entrada y salida (formatos HH:MM:SS).
 * @param {string} horaEntrada - Ej. "08:00:00"
 * @param {string} horaSalida - Ej. "16:30:00"
 * @returns {string} Texto formateado con la duracion (ej. "8 horas 30 minutos").
 */
function calcularDuracionTexto(horaEntrada, horaSalida) {
  if (!horaEntrada || !horaSalida) return null;

  const [h1, m1, s1] = String(horaEntrada).split(':').map(Number);
  const [h2, m2, s2] = String(horaSalida).split(':').map(Number);

  const seg1 = h1 * 3600 + m1 * 60 + (s1 || 0);
  const seg2 = h2 * 3600 + m2 * 60 + (s2 || 0);

  let diferencia = seg2 - seg1;
  if (diferencia < 0) diferencia += 24 * 3600; // En caso de cambio de dia

  const horas = Math.floor(diferencia / 3600);
  const minutos = Math.floor((diferencia % 3600) / 60);

  if (horas === 0 && minutos === 0) return 'menos de 1 minuto';
  if (horas === 0) return `${minutos} minutos`;
  if (minutos === 0) return `${horas} horas`;
  return `${horas} horas ${minutos} minutos`;
}

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Registra una marca de asistencia (ENTRADA o SALIDA) para el usuario autenticado.
 * - Comprueba la IP del cliente contra la tabla `configuracion`.
 * - Comprueba que el dispositivo este registrado a su nombre y este ACTIVO.
 * - Alterna automaticamente el tipo (si la ultima marca fue ENTRADA, la nueva sera SALIDA; de lo contrario ENTRADA).
 * @param {object} req - Request de Express (req.usuario.id, req.ip, req.cookies).
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function marcar(req, res, next) {
  try {
    const usuarioId = req.usuario.id;
    const ipClienteRaw = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipCliente = normalizarIp(ipClienteRaw);

    // 1. Validacion de ubicacion de red (Rango de IP permitido)
    const rangoIpPermitido = await marcasModel.obtenerRangoIpPermitido();
    if (!esIpPermitida(ipCliente, rangoIpPermitido)) {
      return error(res, 'No es posible realizar la marca desde la red actual.', 403);
    }

    // 2. Validacion de dispositivo autorizado
    const dispositivoId =
      req.cookies?.[DEVICE_COOKIE] ||
      req.body?.dispositivo_id ||
      req.headers['x-device-id'];

    if (!dispositivoId) {
      return error(
        res,
        'No se ha detectado un dispositivo autorizado en la peticion. Registre su dispositivo primero.',
        400
      );
    }

    const dispositivo = await dispositivosModel.obtenerDispositivoPorId(dispositivoId);
    if (!dispositivo || dispositivo.usuario_id !== usuarioId) {
      return error(
        res,
        'El dispositivo utilizado no pertenece a este usuario o no esta registrado.',
        403
      );
    }

    if (dispositivo.estado !== 'ACTIVO') {
      return error(
        res,
        'El dispositivo se encuentra INACTIVO. Contacte al administrador o active su dispositivo.',
        403
      );
    }

    // 3. Determinar automaticamente el tipo de marca (ENTRADA o SALIDA)
    const ultimaMarca = await marcasModel.obtenerUltimaMarcaPorUsuario(usuarioId);
    let nuevoTipo = 'ENTRADA';

    if (ultimaMarca && ultimaMarca.tipo === 'ENTRADA') {
      nuevoTipo = 'SALIDA';
    }

    const ahora = new Date();
    const fecha = obtenerFechaActualTexto(ahora);
    const hora = obtenerHoraActualTexto(ahora);

    // 4. Guardar la marca en la base de datos
    const marcaId = await marcasModel.registrarMarca({
      usuario_id: usuarioId,
      dispositivo_id: dispositivoId,
      fecha,
      hora,
      tipo: nuevoTipo,
      ip: ipCliente,
    });

    const marcaRegistrada = await marcasModel.obtenerMarcaPorId(marcaId);

    // Si la marca es SALIDA, calculamos el tiempo laborado con respecto a la ENTRADA anterior
    let duracionCalculada = null;
    if (nuevoTipo === 'SALIDA' && ultimaMarca) {
      duracionCalculada = calcularDuracionTexto(ultimaMarca.hora, hora);
    }

    const mensaje = `Marca de ${nuevoTipo} registrada correctamente a las ${hora}${
      duracionCalculada ? ` (Tiempo laborado: ${duracionCalculada})` : ''
    }`;

    return ok(
      res,
      {
        ...marcaRegistrada,
        duracion_calculada: duracionCalculada,
        duracion_laborada: duracionCalculada,
      },
      mensaje,
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene el estado actual del usuario (ultima marca, estado DENTRO/FUERA e IP).
 * @param {object} req - Request de Express (req.usuario.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function obtenerEstadoActual(req, res, next) {
  try {
    const usuarioId = req.usuario.id;
    const ultimaMarca = await marcasModel.obtenerUltimaMarcaPorUsuario(usuarioId);
    const ipClienteRaw = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipCliente = normalizarIp(ipClienteRaw);
    const rangoIpPermitido = await marcasModel.obtenerRangoIpPermitido();
    const ipValida = esIpPermitida(ipCliente, rangoIpPermitido);

    const estadoActual = {
      estado_asistencia: ultimaMarca?.tipo === 'ENTRADA' ? 'DENTRO' : 'FUERA',
      siguiente_marca_sugerida: ultimaMarca?.tipo === 'ENTRADA' ? 'SALIDA' : 'ENTRADA',
      ultima_marca: ultimaMarca,
      ip_cliente: ipCliente,
      ip_autorizada: ipValida,
    };

    return ok(res, estadoActual, 'Estado actual obtenido correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Consulta el historial de marcas del usuario autenticado con calculo de duracion entre entradas y salidas.
 * @param {object} req - Request de Express (req.usuario.id).
 * @param {object} res - Response de Express.
 * @param {Function} next - Middleware de manejo de errores.
 */
export async function listarMisMarcas(req, res, next) {
  try {
    const marcas = await marcasModel.obtenerMarcasPorUsuario(req.usuario.id);

    // Procesar marcas para calcular duraciones en parejas ENTRADA -> SALIDA
    const marcasConDuracion = [];
    for (let i = 0; i < marcas.length; i++) {
      const marca = { ...marcas[i] };
      const fechaStr = String(marca.fecha).slice(0, 10);

      if (marca.tipo === 'SALIDA' && i < marcas.length - 1) {
        const siguiente = marcas[i + 1];
        const fechaSigStr = String(siguiente.fecha).slice(0, 10);

        if (siguiente.tipo === 'ENTRADA' && fechaSigStr === fechaStr) {
          const dur = calcularDuracionTexto(siguiente.hora, marca.hora);
          marca.duracion_calculada = dur;
          marca.duracion_laborada = dur;
        }
      }
      marcasConDuracion.push(marca);
    }

    return ok(res, marcasConDuracion, 'Historial de marcas obtenido correctamente');
  } catch (err) {
    next(err);
  }
}
