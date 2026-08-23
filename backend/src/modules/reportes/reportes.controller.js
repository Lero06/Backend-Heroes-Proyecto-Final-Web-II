/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: reportes.controller.js
Autor: Gloriana Carrillo Alfaro
Fecha: 18/08/2026
Modulo: Reportes / Filtros / Exportacion
Descripcion:
Logica de negocio del modulo de reportes de marcas. Expone cuatro
acciones: listar el reporte en JSON estandar, y exportar los mismos
datos en formato JSON descargable, XML y PDF. Todas las acciones
aceptan los mismos filtros opcionales via query params.
Los errores internos nunca se exponen al cliente: solo se envia un
mensaje generico y el detalle se pasa al manejador global con next(err).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { ok, error } from '../../utils/response.js';
import * as reportesModel from './reportes.model.js';
import { create } from 'xmlbuilder2';
import PDFDocument from 'pdfkit';

/*
//////////////////////////////////////////////////////////
FUNCION AUXILIAR PRIVADA
//////////////////////////////////////////////////////////
*/

/**
 * Lee y castea los query params de filtro a sus tipos correctos.
 * Los valores ausentes quedan como undefined (el model los ignora).
 * @param {object} req - Request de Express.
 * @returns {{ usuarioId: number|undefined, anio: number|undefined, mes: number|undefined, dia: number|undefined, departamentoId: number|undefined }}
 */
function leerFiltros(req) {
  const { usuario, anio, mes, dia, departamento } = req.query;

  return {
    usuarioId:      usuario     ? Number(usuario)     : undefined,
    anio:           anio        ? Number(anio)        : undefined,
    mes:            mes         ? Number(mes)         : undefined,
    dia:            dia         ? Number(dia)         : undefined,
    departamentoId: departamento ? Number(departamento) : undefined,
  };
}

/*
//////////////////////////////////////////////////////////
FUNCIONES PRINCIPALES
//////////////////////////////////////////////////////////
*/

/**
 * Devuelve el reporte de marcas filtrado en el formato estandar de la API.
 * Respuesta: { ok: true, data: [...filas], message: '...' }
 * @param {object} req  - Request de Express (query params opcionales: usuario, anio, mes, dia, departamento).
 * @param {object} res  - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<object>} Respuesta HTTP con el listado del reporte.
 */
export async function listarReporte(req, res, next) {
  try {
    const filtros = leerFiltros(req);
    const filas   = await reportesModel.obtenerMarcasFiltradas(filtros);
    return ok(res, filas, 'Reporte generado correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * Exporta el reporte de marcas filtrado como archivo JSON descargable.
 * Usa res.json() directamente (no el helper ok()) porque la respuesta
 * es un archivo adjunto, no la respuesta estandar de la API.
 * @param {object} req  - Request de Express.
 * @param {object} res  - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<void>}
 */
export async function exportarJSON(req, res, next) {
  try {
    const filtros = leerFiltros(req);
    const filas   = await reportesModel.obtenerMarcasFiltradas(filtros);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-marcas.json"');
    return res.json(filas);
  } catch (err) {
    next(err);
  }
}

/**
 * Exporta el reporte de marcas filtrado como archivo XML descargable.
 * Estructura: <reporteMarcas><marca>...</marca>...</reporteMarcas>
 * @param {object} req  - Request de Express.
 * @param {object} res  - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<void>}
 */
export async function exportarXML(req, res, next) {
  try {
    const filtros = leerFiltros(req);
    const filas   = await reportesModel.obtenerMarcasFiltradas(filtros);

    // Construye el arbol XML con xmlbuilder2
    const raiz = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('reporteMarcas', { generado_en: new Date().toISOString() });

    for (const fila of filas) {
      raiz.ele('marca')
        .ele('usuario_id').txt(String(fila.usuario_id ?? '')).up()
        .ele('nombre_completo').txt(fila.nombre_completo ?? '').up()
        .ele('departamento').txt(fila.departamento ?? '').up()
        .ele('fecha').txt(fila.fecha ? String(fila.fecha).slice(0, 10) : '').up()
        .ele('hora_entrada').txt(fila.hora_entrada ?? '').up()
        .ele('hora_salida').txt(fila.hora_salida ?? '').up()
        .ele('dispositivo_entrada').txt(fila.dispositivo_entrada ?? '').up()
        .ele('dispositivo_salida').txt(fila.dispositivo_salida ?? '').up()
        .ele('ip').txt(fila.ip ?? '').up()
      .up();
    }

    const xmlString = raiz.end({ prettyPrint: true });

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-marcas.xml"');
    return res.send(xmlString);
  } catch (err) {
    next(err);
  }
}

/**
 * Exporta el reporte de marcas filtrado como archivo PDF descargable.
 * Genera el PDF con pdfkit usando streaming directo a `res` (sin buffers
 * intermedios) para no acumular el documento completo en memoria.
 * @param {object} req  - Request de Express.
 * @param {object} res  - Response de Express.
 * @param {Function} next - Siguiente middleware (manejo de errores).
 * @returns {Promise<void>}
 */
export async function exportarPDF(req, res, next) {
  try {
    const filtros = leerFiltros(req);
    const filas   = await reportesModel.obtenerMarcasFiltradas(filtros);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-marcas.pdf"');

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    // ----- Encabezado del documento -----
    doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Marcas', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(
      `Generado el: ${new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })}`,
      { align: 'center' }
    );
    doc.moveDown(1.5);

    if (filas.length === 0) {
      doc.fontSize(12).text('No se encontraron registros con los filtros aplicados.', { align: 'center' });
      doc.end();
      return;
    }

    // ----- Cabecera de la tabla -----
    // Ancho total utilizable en A4 landscape con margin 40: ~752px (595*1.41 - 80)
    const COLS = {
      nombre:   { x: 40,  width: 140 },
      depto:    { x: 180, width: 100 },
      fecha:    { x: 280, width: 70  },
      entrada:  { x: 350, width: 60  },
      salida:   { x: 410, width: 60  },
      d_ent:    { x: 470, width: 110 },
      d_sal:    { x: 580, width: 110 },
      ip:       { x: 690, width: 105 },
    };

    const ROW_H = 18;
    const PAGE_BOTTOM = doc.page.height - 60;

    /**
     * Dibuja una fila de la tabla (cabecera o dato).
     * @param {object} campos - Mapa nombre_col -> texto.
     * @param {boolean} [esEncabezado=false] - Si es true, usa negrita.
     */
    function dibujarFila(campos, esEncabezado = false) {
      const y = doc.y;

      // Fondo gris claro para el encabezado
      if (esEncabezado) {
        doc.rect(40, y, 740, ROW_H).fill('#e0e0e0').fillColor('black');
      }

      doc.font(esEncabezado ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);

      for (const [key, col] of Object.entries(COLS)) {
        doc.text(campos[key] ?? '', col.x, y + 3, { width: col.width - 4, ellipsis: true, lineBreak: false });
      }

      // Linea horizontal
      doc.moveTo(40, y + ROW_H).lineTo(780, y + ROW_H).strokeColor('#cccccc').stroke();
      doc.y = y + ROW_H;
    }

    // Encabezado de la tabla
    dibujarFila({
      nombre:  'Usuario',
      depto:   'Departamento',
      fecha:   'Fecha',
      entrada: 'H. Entrada',
      salida:  'H. Salida',
      d_ent:   'Disp. Entrada',
      d_sal:   'Disp. Salida',
      ip:      'IP',
    }, true);

    // Filas de datos
    for (const fila of filas) {
      // Salto de pagina si no hay espacio
      if (doc.y + ROW_H > PAGE_BOTTOM) {
        doc.addPage();
        dibujarFila({
          nombre:  'Usuario',
          depto:   'Departamento',
          fecha:   'Fecha',
          entrada: 'H. Entrada',
          salida:  'H. Salida',
          d_ent:   'Disp. Entrada',
          d_sal:   'Disp. Salida',
          ip:      'IP',
        }, true);
      }

      dibujarFila({
        nombre:  fila.nombre_completo ?? '',
        depto:   fila.departamento ?? '',
        fecha:   fila.fecha ? String(fila.fecha).slice(0, 10) : '',
        entrada: fila.hora_entrada ?? '-',
        salida:  fila.hora_salida  ?? '-',
        d_ent:   fila.dispositivo_entrada ?? '-',
        d_sal:   fila.dispositivo_salida  ?? '-',
        ip:      fila.ip ?? '',
      });
    }

    doc.end();
  } catch (err) {
    console.error('Error generando PDF de reportes:', err);
    if (!res.headersSent) {
      return error(res, 'Error al generar el PDF', 500);
    }
    // Los headers ya se enviaron (el stream del PDF ya empezo): no se puede
    // mandar una respuesta JSON de error nueva. Solo cerramos la conexion.
    if (!res.writableEnded) {
      res.end();
    }
  }
}

export { listarReporte, exportarJSON, exportarXML, exportarPDF };
