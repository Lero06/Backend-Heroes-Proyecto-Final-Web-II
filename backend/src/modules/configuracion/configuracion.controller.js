/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: configuracion.controller.js
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Configuración del Sistema
Descripcion:
Logica de negocio para consultar y modificar configuraciones del sistema,
especialmente la validacion estricta del rango de IP permitido (`rango_ip_permitido`).
//////////////////////////////////////////////////////////
*/

import { ok, error } from '../../utils/response.js';
import { validarFormatoRangoIp } from '../../utils/ip.util.js';
import * as configuracionModel from './configuracion.model.js';

/**
 * Obtiene todas las configuraciones del sistema.
 */
export async function listar(req, res, next) {
  try {
    const configs = await configuracionModel.obtenerTodas();
    return ok(res, configs, 'Configuraciones obtenidas correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene el valor de una clave especifica (ej. rango_ip_permitido).
 */
export async function obtenerPorClave(req, res, next) {
  try {
    const { clave } = req.params;
    const config = await configuracionModel.obtenerPorClave(clave);
    if (!config) return error(res, 'Configuración no encontrada', 404);
    return ok(res, config, 'Configuración obtenida correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Actualiza el valor de una clave de configuracion (Requiere rol administrador).
 * Si la clave es `rango_ip_permitido`, valida estrictamente que la notacion IP / CIDR sea valida.
 */
export async function actualizar(req, res, next) {
  try {
    const { clave } = req.params;
    const { valor } = req.body;

    if (clave === 'rango_ip_permitido') {
      if (!validarFormatoRangoIp(valor)) {
        return error(
          res,
          'El formato de IP ingresado no es válido. Debe usar notación IPv4 completa (ej. 192.168.1.15) o rango CIDR (ej. 192.168.1.0/24 o 0.0.0.0/0).',
          400
        );
      }
    }

    const actualizado = await configuracionModel.actualizarValor(clave, valor);
    if (!actualizado) return error(res, 'Configuración no encontrada o no modificada', 400);

    const configActualizada = await configuracionModel.obtenerPorClave(clave);
    return ok(res, configActualizada, `Configuración "${clave}" actualizada correctamente`);
  } catch (err) {
    next(err);
  }
}
