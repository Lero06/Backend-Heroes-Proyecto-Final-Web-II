/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: reportes.model.js
Autor: Gloriana Carrillo Alfaro
Fecha: 18/08/2026
Modulo: Reportes / Filtros / Exportacion
Descripcion:
Acceso a datos del modulo de reportes de marcas. Provee una unica
funcion que consulta la tabla `marcas` con JOINs a usuarios y
departamentos, agrupa los registros por usuario y fecha para obtener
hora de entrada y hora de salida en una sola fila, y aplica filtros
dinamicos parametrizados (usuarioId, anio, mes, dia, departamentoId).
Nunca se concatenan variables directamente en el SQL; todos los
valores se pasan como placeholders ? para prevenir inyeccion SQL.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import pool from '../../config/db.js';

/*
//////////////////////////////////////////////////////////
FUNCIONES DE ACCESO A DATOS
//////////////////////////////////////////////////////////
*/

/**
 * Obtiene las marcas agrupadas por usuario y fecha, calculando hora de
 * entrada (MIN ENTRADA) y hora de salida (MAX SALIDA) en la misma fila.
 * Todos los filtros son opcionales y se combinan dinamicamente con AND.
 *
 * Columnas devueltas por fila:
 *   - hora_entrada, hora_salida   (agregacion condicional por tipo)
 *   - dispositivo_entrada          (dispositivo usado en la marca ENTRADA)
 *   - dispositivo_salida           (dispositivo usado en la marca SALIDA)
 *   - ip                           (IP de entrada; si no hay, cualquier IP del dia)
 *
 * @param {object} filtros - Objeto de filtros opcionales.
 * @param {number} [filtros.usuarioId]      - Filtra por id de usuario.
 * @param {number} [filtros.anio]           - Filtra por año de la marca (YEAR(fecha)).
 * @param {number} [filtros.mes]            - Filtra por mes de la marca (MONTH(fecha)).
 * @param {number} [filtros.dia]            - Filtra por dia de la marca (DAY(fecha)).
 * @param {number} [filtros.departamentoId] - Filtra por id de departamento del usuario.
 * @returns {Promise<Array<object>>} Lista de filas agrupadas con los campos del reporte.
 */
export async function obtenerMarcasFiltradas({ usuarioId, anio, mes, dia, departamentoId } = {}) {
  // Clausulas WHERE dinamicas y valores parametrizados
  const condiciones = [];
  const valores = [];

  if (usuarioId) {
    condiciones.push('m.usuario_id = ?');
    valores.push(usuarioId);
  }

  if (anio) {
    condiciones.push('YEAR(m.fecha) = ?');
    valores.push(anio);
  }

  if (mes) {
    condiciones.push('MONTH(m.fecha) = ?');
    valores.push(mes);
  }

  if (dia) {
    condiciones.push('DAY(m.fecha) = ?');
    valores.push(dia);
  }

  if (departamentoId) {
    condiciones.push('u.departamento_id = ?');
    valores.push(departamentoId);
  }

  const clausulaWhere =
    condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  // LEFT JOIN dispositivos: un usuario puede no tener dispositivo registrado.
  // Un unico JOIN a dispositivos es suficiente porque dispositivo_id vive en
  // la misma fila de marcas que m.tipo; el CASE filtra por tipo igual que
  // se hace con hora_entrada/hora_salida.
  // COALESCE en ip: si no hubo marca de ENTRADA ese dia, usa cualquier IP.
  const sql = `
    SELECT
      u.id                                                           AS usuario_id,
      u.nombre_completo,
      d.nombre                                                       AS departamento,
      m.fecha,
      MIN(CASE WHEN m.tipo = 'ENTRADA' THEN m.hora END)             AS hora_entrada,
      MAX(CASE WHEN m.tipo = 'SALIDA'  THEN m.hora END)             AS hora_salida,
      MAX(CASE WHEN m.tipo = 'ENTRADA' THEN disp.nombre END)        AS dispositivo_entrada,
      MAX(CASE WHEN m.tipo = 'SALIDA'  THEN disp.nombre END)        AS dispositivo_salida,
      COALESCE(
        MAX(CASE WHEN m.tipo = 'ENTRADA' THEN m.ip END),
        MAX(m.ip)
      )                                                              AS ip
    FROM marcas m
    INNER JOIN usuarios      u    ON m.usuario_id     = u.id
    LEFT  JOIN departamentos d    ON u.departamento_id = d.id
    LEFT  JOIN dispositivos  disp ON m.dispositivo_id  = disp.id
    ${clausulaWhere}
    GROUP BY u.id, u.nombre_completo, d.nombre, m.fecha
    ORDER BY m.fecha DESC, u.nombre_completo ASC
  `;

  const [rows] = await pool.query(sql, valores);
  return rows;
}
