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
departamentos, retornando una fila por cada registro individual de marca
(sin agrupacion). Aplica filtros dinamicos parametrizados
(usuarioId, anio, mes, dia, departamentoId, soloPropio).
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
 * Obtiene las marcas individuales (una fila por cada registro en la tabla marcas)
 * con JOINs a usuarios, departamentos y dispositivos.
 * Todos los filtros son opcionales y se combinan dinamicamente con AND.
 *
 * Columnas devueltas por fila:
 *   - id                           (id de la marca)
 *   - usuario_id, nombre_completo  (datos del usuario)
 *   - departamento                 (nombre del departamento o null)
 *   - fecha, hora, tipo            (fecha/hora y tipo ENTRADA o SALIDA)
 *   - dispositivo_nombre           (nombre del dispositivo o null)
 *   - ip                           (IP del cliente al marcar)
 *
 * @param {object} filtros - Objeto de filtros opcionales.
 * @param {number} [filtros.usuarioId]        - Filtra por id de usuario.
 * @param {number} [filtros.anio]             - Filtra por anio de la marca (YEAR(fecha)).
 * @param {number} [filtros.mes]              - Filtra por mes de la marca (MONTH(fecha)).
 * @param {number} [filtros.dia]              - Filtra por dia de la marca (DAY(fecha)).
 * @param {number} [filtros.departamentoId]   - Filtra por id de departamento del usuario.
 * @param {Array<number>} [filtros.ids]       - Filtra por IDs especificos de marcas.
 * @returns {Promise<Array<object>>} Lista de marcas individuales con los campos del reporte.
 */
export async function obtenerMarcasFiltradas({
  usuarioId,
  anio,
  mes,
  dia,
  departamentoId,
  ids,
} = {}) {
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

  // Filtrar por IDs especificos (para exportar marcas seleccionadas)
  if (ids && ids.length > 0) {
    condiciones.push(`m.id IN (${ids.map(() => '?').join(',')})`);
    valores.push(...ids);
  }

  const clausulaWhere =
    condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  // Query plana: una fila por cada registro individual en la tabla marcas.
  // No se agrupa por fecha; se muestran todas las marcas del dia tal como fueron registradas.
  const sql = `
    SELECT
      m.id,
      u.id               AS usuario_id,
      u.nombre_completo,
      d.nombre           AS departamento,
      m.fecha,
      m.hora,
      m.tipo,
      disp.nombre        AS dispositivo_nombre,
      m.ip
    FROM marcas m
    INNER JOIN usuarios      u    ON m.usuario_id     = u.id
    LEFT  JOIN departamentos d    ON u.departamento_id = d.id
    LEFT  JOIN dispositivos  disp ON m.dispositivo_id  = disp.id
    ${clausulaWhere}
    ORDER BY m.fecha DESC, m.hora DESC, u.nombre_completo ASC
  `;

  const [rows] = await pool.query(sql, valores);
  return rows;
}
