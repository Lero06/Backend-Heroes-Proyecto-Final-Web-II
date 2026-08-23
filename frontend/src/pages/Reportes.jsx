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

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
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
  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState('');
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    apiFetch('/departamentos').then((respuesta) => {
      if (respuesta.ok) setDepartamentos(respuesta.data);
    });
  }, []);

  const manejarCambioFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ usuario: '', anio: '', mes: '', dia: '', departamento: '' });
    setFilas([]);
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
    setMensajeBusqueda(
      respuesta.data.length === 0
        ? 'No se encontraron marcas con los filtros aplicados.'
        : `Se encontraron ${respuesta.data.length} registro(s).`
    );
  }, [filtros]);

  const descargarJSON = () => exportarReporteJSON(filtros);
  const descargarXML = () => exportarReporteXML(filtros);
  const descargarPDF = () => exportarReportePDF(filtros);

  if (!usuario) return null;

  if (usuario.rol !== 'administrador') {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
        <Alert
          color="rojo"
          titulo="Acceso denegado."
          texto="No tiene permisos para ver esta sección."
        />
      </div>
    );
  }

  return (
    <>
      <Navbar
        color="azul"
        texto="SIGMA"
        navList={true}
        links={obtenerLinksNav(usuario, '/reportes')}
        buttonContent={
          <Button
            color="rojo"
            tamano="pequeño"
            onClick={logout}
            texto="Cerrar sesion"
          />
        }
      />

      <div className="container-fluid px-4">
        <Titulo tipografia="h2" texto="Reporte de Marcas" color_text="negro" alineado="centro" />

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
                  'Usuario',
                  'Departamento',
                  'Fecha',
                  'Hora Entrada',
                  'Hora Salida',
                  'Disp. Entrada',
                  'Disp. Salida',
                  'IP'
                ]}
              >
                {filas.map((fila, idx) => (
                  <tr key={`${fila.usuario_id}-${fila.fecha}-${idx}`} style={{ color: '#000000' }}>
                    <td style={{ color: '#000000' }}>{fila.nombre_completo}</td>
                    <td style={{ color: '#000000' }}>{fila.departamento ?? '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.fecha ? String(fila.fecha).slice(0, 10) : '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.hora_entrada ?? '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.hora_salida ?? '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.dispositivo_entrada ?? '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.dispositivo_salida ?? '—'}</td>
                    <td style={{ color: '#000000' }}>{fila.ip ?? '—'}</td>
                  </tr>
                ))}
              </Tabla>
            }
          />

          <div className="row g-3 mt-1 mb-4">
            <div className="col-md-4">
              <Button
                id="btn-exportar-xml"
                color="amarillo"
                className="w-100"
                onClick={descargarXML}
                texto="⬇ Exportar XML"
              />
            </div>
            <div className="col-md-4">
              <Button
                id="btn-exportar-pdf"
                color="rojo"
                className="w-100"
                onClick={descargarPDF}
                texto="⬇ Exportar PDF"
              />
            </div>
            <div className="col-md-4">
              <Button
                id="btn-exportar-json"
                color="verde"
                className="w-100"
                onClick={descargarJSON}
                texto="⬇ Exportar JSON"
              />
            </div>
          </div>
        </>
      )}
      </div>
    </>
  );
}
