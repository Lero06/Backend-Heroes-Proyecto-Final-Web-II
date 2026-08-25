/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Reportes.jsx
Autor: Gloriana Carrillo Alfaro
Fecha: 18/08/2026
Modulo: Frontend - Reportes
Descripcion:
Pagina de reportes de marcas (exclusiva de administradores). Permite
filtrar las marcas por usuario, anio, mes, dia y departamento, visualizar
los resultados en una tabla Bootstrap y exportar el reporte en tres
formatos: JSON, XML y PDF.
//////////////////////////////////////////////////////////
*/

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { obtenerLinksNav } from '../utils/navLinks';
import { apiFetch } from '../api/client.js';
import {
  obtenerReporte,
  exportarReporteJSON,
  exportarReporteXML,
  exportarReportePDF,
} from '../api/reportes.js';
import Alert   from '../components/Alert.jsx';
import Select  from '../components/Select.jsx';
import Button  from '../components/Buttons.jsx';
import Titulo  from '../components/Titulo.jsx';
import Card    from '../components/Card.jsx';
import Input   from '../components/Input.jsx';
import Tabla   from '../components/Tabla.jsx';
import Navbar  from '../components/Navbar.jsx';

export default function Reportes() {
  const { usuario, logout } = useAuth();

  const [filtros, setFiltros] = useState({
    usuario: '',
    anio: '',
    mes: '',
    dia: '',
    departamento: '',
  });

  const [filas, setFilas] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [departamentos, setDepartamentos] = useState([]);
  const [empresa, setEmpresa] = useState('Universidad Técnica Nacional');
  const [cargando, setCargando] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState('');
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  // Filas que se exportaran: las seleccionadas, o todas si no hay seleccion
  const filasAExportar = seleccionados.size > 0
    ? filas.filter((f) => seleccionados.has(f.id))
    : filas;

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleTodos = () => {
    setSeleccionados(
      seleccionados.size === filas.length && filas.length > 0
        ? new Set()
        : new Set(filas.map((f) => f.id))
    );
  };

  const todosSeleccionados = filas.length > 0 && seleccionados.size === filas.length;
  const algunoSeleccionado = seleccionados.size > 0 && seleccionados.size < filas.length;

  useEffect(() => {
    apiFetch('/departamentos').then((respuesta) => {
      if (respuesta.ok) setDepartamentos(respuesta.data);
    });

    apiFetch('/configuracion/nombre_institucion').then((respuesta) => {
      if (respuesta.ok && respuesta.data?.valor) {
        setEmpresa(respuesta.data.valor);
      }
    });
  }, []);


  const manejarCambioFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ usuario: '', anio: '', mes: '', dia: '', departamento: '' });
    setFilas([]);
    setSeleccionados(new Set());
    setBuscado(false);
    setMensajeBusqueda('');
    setError('');
  };

  const buscar = useCallback(async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError('');
    setMensajeBusqueda('');
    setCargando(true);
    setBuscado(true);

    const respuesta = await obtenerReporte(filtros);

    setCargando(false);

    if (!respuesta.ok) {
      setError(respuesta.message || 'Error al obtener el reporte');
      setFilas([]);
      return;
    }

    setFilas(respuesta.data);
    setSeleccionados(new Set());
    setMensajeBusqueda(
      respuesta.data.length === 0
        ? 'No se encontraron marcas con los filtros aplicados.'
        : `Se encontraron ${respuesta.data.length} registro(s).`
    );
  }, [filtros]);

  // Cargar la tabla automaticamente al entrar a la pagina (solo al montar)
  const cargaInicialHecha = useRef(false);
  useEffect(() => {
    if (!cargaInicialHecha.current) {
      cargaInicialHecha.current = true;
      buscar();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [descargando, setDescargando] = useState(null); // 'json' | 'xml' | 'pdf' | null

  // Metadatos comunes para las exportaciones
  const metaExport = () => ({
    empresa,
    generado_por: `${usuario?.nombre_completo || usuario?.usuario || 'Usuario'}${
      usuario?.correo ? ` (${usuario.correo})` : ''
    }`,
  });

  // JSON: generado en el cliente a partir de las filas ya cargadas
  const descargarJSON = () => {
    try {
      setDescargando('json');
      setError('');
      exportarReporteJSON(filasAExportar, metaExport());
    } catch (err) {
      setError(err.message || 'Error al exportar a JSON');
    } finally {
      setDescargando(null);
    }
  };

  // XML: generado en el cliente a partir de las filas ya cargadas
  const descargarXML = () => {
    try {
      setDescargando('xml');
      setError('');
      exportarReporteXML(filasAExportar, metaExport());
    } catch (err) {
      setError(err.message || 'Error al exportar a XML');
    } finally {
      setDescargando(null);
    }
  };

  // PDF: usa el backend pasando los IDs seleccionados (o todos si no hay seleccion)
  const descargarPDF = async () => {
    try {
      setDescargando('pdf');
      setError('');
      const ids = seleccionados.size > 0 ? [...seleccionados] : null;
      await exportarReportePDF(filtros, ids);
    } catch (err) {
      setError(err.message || 'Error al exportar a PDF');
    } finally {
      setDescargando(null);
    }
  };

  if (!usuario) return null;

  return (
    <>
      <Navbar
        color="azul"
        texto="SIGMA"
        navList={true}
        links={obtenerLinksNav(usuario, '/reportes')}
      />

      <div className="container-fluid px-4">
        <Titulo tipografia="h2" texto="Reporte de Marcas" color_text="negro" alineado="centro" />
        <div className="text-center text-muted small mb-3">
          <span className="fw-semibold text-primary">{empresa}</span> — Generado por: <strong>{usuario.nombre_completo || usuario.usuario}</strong>
        </div>

        <div className="mb-4">
        <Card
          responsivo={true}
          card_width="100%"
          color_texto="negro"
          texto_alineado="left"
          titulo="Filtros"
          chil_body={
            <form id="form-filtros-reporte" onSubmit={buscar}>
              <div className="row g-3">
                <div className="col-12 col-md">
                  <Input
                    label="ID Usuario"
                    tipo="number"
                    name="usuario"
                    placeholder="Ej: 3"
                    value={filtros.usuario}
                    onChange={manejarCambioFiltro}
                    min="1"
                  />
                </div>

                <div className="col-12 col-md">
                  <Select
                    label="Departamento"
                    texto="— Todos —"
                    options={departamentos.map((d) => ({ value: d.id, text: d.nombre }))}
                    value={filtros.departamento}
                    onChange={(e) => setFiltros({ ...filtros, departamento: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md">
                  <Input
                    label="Año"
                    tipo="number"
                    name="anio"
                    placeholder="Ej: 2026"
                    value={filtros.anio}
                    onChange={manejarCambioFiltro}
                    min="2000"
                    max="2100"
                  />
                </div>

                <div className="col-12 col-md">
                  <Select
                    label="Mes"
                    texto="— Todos —"
                    options={[
                      { value: '1',  text: 'Enero'      },
                      { value: '2',  text: 'Febrero'    },
                      { value: '3',  text: 'Marzo'      },
                      { value: '4',  text: 'Abril'      },
                      { value: '5',  text: 'Mayo'       },
                      { value: '6',  text: 'Junio'      },
                      { value: '7',  text: 'Julio'      },
                      { value: '8',  text: 'Agosto'     },
                      { value: '9',  text: 'Setiembre'  },
                      { value: '10', text: 'Octubre'    },
                      { value: '11', text: 'Noviembre'  },
                      { value: '12', text: 'Diciembre'  },
                    ]}
                    value={filtros.mes}
                    onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md">
                  <Input
                    label="Día"
                    tipo="number"
                    name="dia"
                    placeholder="1-31"
                    value={filtros.dia}
                    onChange={manejarCambioFiltro}
                    min="1"
                    max="31"
                  />
                </div>

                <div className="col-12 d-flex gap-2 align-items-end flex-wrap">
                  <Button
                    id="btn-buscar-reporte"
                    tipo="submit"
                    type="submit"
                    color="azul"
                    cargando={cargando}
                    texto="Buscar"
                    onClick={buscar}
                  />
                  <Button
                    id="btn-limpiar-reporte"
                    color="gris"
                    onClick={limpiarFiltros}
                    texto="Limpiar"
                  />
                </div>
              </div>
            </form>
          }
        />
      </div>

      {error && (
        <Alert color="rojo" fondoBlanco={true} texto={error} dismissible onDismiss={() => setError('')} />
      )}
      {buscado && !error && mensajeBusqueda && filas.length === 0 && (
        <Alert color="rojo" fondoBlanco={true} texto="No se encontraron marcas con los filtros seleccionados." />
      )}
      {buscado && !error && filas.length > 0 && (
        <Alert color="verde" fondoBlanco={true} texto={mensajeBusqueda} />
      )}

      {filas.length > 0 && (
        <>
          <Card
            responsivo={true}
            card_width="100%"
            color_texto="negro"
            texto_alineado="left"
            titulo="Resultados"
            chil_body={
              <Tabla
                columnas={[
                  // Encabezado con checkbox "seleccionar todo"
                  <input
                    key="chk-all"
                    type="checkbox"
                    checked={todosSeleccionados}
                    ref={(el) => { if (el) el.indeterminate = algunoSeleccionado; }}
                    onChange={toggleTodos}
                    title={todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />,
                  'Usuario',
                  'Departamento',
                  'Fecha',
                  'Hora',
                  'Tipo',
                  'Dispositivo',
                  'IP',
                ]}
              >
                {filas.map((fila, idx) => (
                  <tr
                    key={`${fila.id ?? idx}`}
                    style={{ color: '#000000', backgroundColor: seleccionados.has(fila.id) ? '#e8f4fd' : '' }}
                    onClick={() => toggleSeleccion(fila.id)}
                    className="cursor-pointer"
                  >
                    <td className="text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={seleccionados.has(fila.id)}
                        onChange={() => toggleSeleccion(fila.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ color: '#000000' }}>{fila.nombre_completo}</td>
                    <td style={{ color: '#000000' }}>{fila.departamento ?? '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.fecha ? String(fila.fecha).slice(0, 10) : '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.hora ?? '—'}</td>
                    <td style={{ color: '#000000' }}>
                      <span className={`badge ${fila.tipo === 'ENTRADA' ? 'bg-success' : 'bg-primary'} px-2 py-1`}>
                        {fila.tipo ?? '—'}
                      </span>
                    </td>
                    <td style={{ color: '#000000' }}>{fila.dispositivo_nombre ?? '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.ip ?? '—'}</td>
                  </tr>
                ))}
              </Tabla>
            }
          />

          {/* Boton para limpiar seleccion si hay elementos marcados */}
          {seleccionados.size > 0 && (
            <div className="d-flex justify-content-start mt-2 mb-1 px-1">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSeleccionados(new Set())}
              >
                Limpiar selección
              </button>
            </div>
          )}

          <div className="row g-3 mt-0 mb-4">
            <div className="col-md-4">
              <Button
                id="btn-exportar-xml"
                color="amarillo"
                className="w-100"
                cargando={descargando === 'xml'}
                disabled={Boolean(descargando)}
                onClick={descargarXML}
                texto="Exportar XML"
              />
            </div>
            <div className="col-md-4">
              <Button
                id="btn-exportar-pdf"
                color="rojo"
                className="w-100"
                cargando={descargando === 'pdf'}
                disabled={Boolean(descargando)}
                onClick={descargarPDF}
                texto="Exportar PDF"
              />
            </div>
            <div className="col-md-4">
              <Button
                id="btn-exportar-json"
                color="verde"
                className="w-100"
                cargando={descargando === 'json'}
                disabled={Boolean(descargando)}
                onClick={descargarJSON}
                texto="Exportar JSON"
              />
            </div>
          </div>
        </>
      )}
      </div>
    </>
  );
}
