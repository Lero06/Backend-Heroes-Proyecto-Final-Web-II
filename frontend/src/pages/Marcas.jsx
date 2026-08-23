/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Marcas.jsx
Autor: Marco Vásquez
Fecha: 22/08/2026
Modulo: Frontend - Marcas y Dispositivos
Descripcion:
Pantalla principal para el Modulo de Marcas y Dispositivos. Permite
marcar entrada y salida con alternancia automatica, verificar el estado
de asistencia en vivo, consultar la red IP, registrar el navegador como
dispositivo autorizado, gestionar dispositivos y ver el historial con
duracion laborada calculada.
//////////////////////////////////////////////////////////
*/

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { marcarAsistencia, obtenerEstadoActual, obtenerMisMarcas } from '../api/marcas.js';
import {
  registrarDispositivo,
  obtenerMisDispositivos,
  cambiarEstadoDispositivo,
  eliminarDispositivo,
} from '../api/dispositivos.js';

import Navbar from '../components/Navbar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Buttons.jsx';
import Alert from '../components/Alert.jsx';
import Input from '../components/Input.jsx';
import Tabla from '../components/Tabla.jsx';
import Titulo from '../components/Titulo.jsx';

export default function Marcas() {
  const { usuario, logout } = useAuth();

  // Pestaña activa ('asistencia' o 'dispositivos')
  const [tabActiva, setTabActiva] = useState('asistencia');

  // Estado de Asistencia
  const [estadoActual, setEstadoActual] = useState(null);
  const [historialMarcas, setHistorialMarcas] = useState([]);
  const [cargandoMarca, setCargandoMarca] = useState(false);
  const [mensajeMarca, setMensajeMarca] = useState(null);
  const [horaEnVivo, setHoraEnVivo] = useState(new Date().toLocaleTimeString());

  // Estado de Dispositivos
  const [dispositivos, setDispositivos] = useState([]);
  const [nuevoDispositivo, setNuevoDispositivo] = useState({ nombre: '', descripcion: '' });
  const [cargandoDispositivo, setCargandoDispositivo] = useState(false);
  const [mensajeDispositivo, setMensajeDispositivo] = useState(null);

  // Reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => setHoraEnVivo(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos de marcas y estado actual
  const cargarDatosMarcas = useCallback(async () => {
    const resEstado = await obtenerEstadoActual();
    if (resEstado.ok) setEstadoActual(resEstado.data);

    const resHistorial = await obtenerMisMarcas();
    if (resHistorial.ok) setHistorialMarcas(resHistorial.data);
  }, []);

  // Cargar dispositivos autorizados
  const cargarDispositivos = useCallback(async () => {
    const resDisp = await obtenerMisDispositivos();
    if (resDisp.ok) setDispositivos(resDisp.data);
  }, []);

  useEffect(() => {
    if (usuario) {
      cargarDatosMarcas();
      cargarDispositivos();
    }
  }, [usuario, cargarDatosMarcas, cargarDispositivos]);

  // Ejecutar Marca (ENTRADA / SALIDA)
  const ejecutarMarca = async () => {
    setMensajeMarca(null);
    setCargandoMarca(true);

    const res = await marcarAsistencia();
    setCargandoMarca(false);

    setMensajeMarca({
      tipo: res.ok ? 'verde' : 'rojo',
      texto: res.message,
    });

    if (res.ok) {
      cargarDatosMarcas();
    }
  };

  // Registrar Dispositivo
  const guardarDispositivo = async (e) => {
    e.preventDefault();
    setMensajeDispositivo(null);

    if (!nuevoDispositivo.nombre.trim()) {
      setMensajeDispositivo({ tipo: 'rojo', texto: 'Por favor ingrese el nombre del dispositivo.' });
      return;
    }

    setCargandoDispositivo(true);
    const res = await registrarDispositivo(nuevoDispositivo);
    setCargandoDispositivo(false);

    setMensajeDispositivo({
      tipo: res.ok ? 'verde' : 'rojo',
      texto: res.message,
    });

    if (res.ok) {
      setNuevoDispositivo({ nombre: '', descripcion: '' });
      cargarDispositivos();
      cargarDatosMarcas();
    }
  };

  // Cambiar estado del dispositivo
  const toggleEstadoDispositivo = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const res = await cambiarEstadoDispositivo(id, nuevoEstado);
    if (res.ok) {
      cargarDispositivos();
      cargarDatosMarcas();
    }
  };

  // Eliminar dispositivo
  const handleEliminarDispositivo = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este dispositivo autorizado?')) return;
    const res = await eliminarDispositivo(id);
    if (res.ok) {
      cargarDispositivos();
      cargarDatosMarcas();
    }
  };

  if (!usuario) return null;

  const esEntrada = estadoActual?.siguiente_marca_sugerida === 'ENTRADA';
  const estadoAsistencia = estadoActual?.estado_asistencia || 'FUERA';
  const ipCliente = estadoActual?.ip_cliente || 'Detectando...';
  const ipAutorizada = estadoActual?.ip_autorizada ?? true;

  return (
    <>
      {/* Navbar Superior */}
      <Navbar
        color="azul"
        texto="SIGMA - Marcas & Dispositivos"
        navList={true}
        links={[
          { texto: 'Marcas & Dispositivos', url: '/marcas', active: true },
          ...(usuario.rol === 'administrador' ? [{ texto: 'Reportes', url: '/reportes', active: false }] : []),
          { texto: 'Mi Perfil', url: '/perfil', active: false },
        ]}
        buttonContent={
          <Button color="rojo" tamano="pequeño" onClick={logout} texto="Cerrar sesión" />
        }
      />

      <div className="container-fluid px-4 py-2">
        {/* Selector de Pestañas (Tabs) */}
        <div className="d-flex justify-content-center mb-4">
          <div className="btn-group shadow-sm" role="group">
            <button
              className={`btn btn-${tabActiva === 'asistencia' ? 'primary' : 'outline-primary'} px-4 py-2 fw-bold`}
              onClick={() => setTabActiva('asistencia')}
            >
              <i className="bi bi-clock-history me-2"></i> Asistencia & Marcas
            </button>
            <button
              className={`btn btn-${tabActiva === 'dispositivos' ? 'primary' : 'outline-primary'} px-4 py-2 fw-bold`}
              onClick={() => setTabActiva('dispositivos')}
            >
              <i className="bi bi-laptop me-2"></i> Dispositivos Autorizados
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PESTAÑA 1: REGISTRO DE ASISTENCIA                              */}
        {/* ============================================================== */}
        {tabActiva === 'asistencia' && (
          <div className="row g-4 justify-content-center">
            {/* Tarjeta de Control Principal */}
            <div className="col-12 col-lg-8">
              <Card
                responsivo={true}
                card_width="100%"
                titulo="Control de Asistencia"
                texto_alineado="center"
                chil_body={
                  <div className="py-3">
                    {/* Badge de Estado Actual */}
                    <div className="mb-3">
                      <span className="text-muted d-block mb-1 fs-6">Estado de Asistencia:</span>
                      <span
                        className={`badge ${
                          estadoAsistencia === 'DENTRO' ? 'bg-success' : 'bg-secondary'
                        } fs-4 px-4 py-2 shadow-sm rounded-pill`}
                      >
                        {estadoAsistencia === 'DENTRO' ? '🟢 DENTRO (En Jornada)' : '⚪ FUERA (Sin Marca Activa)'}
                      </span>
                    </div>

                    {/* Reloj en Vivo e IP */}
                    <div className="row justify-content-center g-3 my-2 text-center">
                      <div className="col-auto">
                        <div className="p-2 border rounded bg-light">
                          <small className="text-muted d-block">Hora Local System</small>
                          <strong className="fs-5 text-dark">{horaEnVivo}</strong>
                        </div>
                      </div>
                      <div className="col-auto">
                        <div className="p-2 border rounded bg-light">
                          <small className="text-muted d-block">IP de Conexión</small>
                          <strong className="fs-5 text-dark">{ipCliente}</strong>{' '}
                          {ipAutorizada ? (
                            <span className="badge bg-success">Red Autorizada ✓</span>
                          ) : (
                            <span className="badge bg-danger">Red No Permitida ✕</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mensajes de Alerta */}
                    {mensajeMarca && (
                      <div className="my-3">
                        <Alert
                          color={mensajeMarca.tipo}
                          fondoBlanco={true}
                          texto={mensajeMarca.texto}
                          dismissible={true}
                          onDismiss={() => setMensajeMarca(null)}
                        />
                      </div>
                    )}

                    {!ipAutorizada && (
                      <div className="my-3">
                        <Alert
                          color="rojo"
                          fondoBlanco={true}
                          titulo="Red No Permitida"
                          texto="No es posible realizar la marca desde la red actual."
                        />
                      </div>
                    )}

                    {/* Botón Principal de Acción */}
                    <div className="mt-4">
                      <Button
                        color={esEntrada ? 'verde' : 'rojo'}
                        tamano="grande"
                        cargando={cargandoMarca}
                        disabled={!ipAutorizada}
                        onClick={ejecutarMarca}
                        className="px-5 py-3 fs-4 fw-bold shadow"
                        texto={esEntrada ? '📥 MARCAR ENTRADA' : '📤 MARCAR SALIDA'}
                      />
                    </div>
                  </div>
                }
              />
            </div>

            {/* Historial de Marcas del Usuario */}
            <div className="col-12 col-lg-10">
              <Card
                responsivo={true}
                card_width="100%"
                titulo="Mi Historial de Marcas"
                texto_alineado="left"
                chil_body={
                  historialMarcas.length === 0 ? (
                    <p className="text-muted text-center py-3 mb-0">
                      No tienes marcas registradas aún. Haz clic en el botón superior para realizar tu primera marca.
                    </p>
                  ) : (
                    <Tabla
                      columnas={[
                        'Fecha',
                        'Hora',
                        'Tipo de Marca',
                        'Dispositivo',
                        'Dirección IP',
                        'Tiempo Laborado',
                      ]}
                    >
                      {historialMarcas.map((m) => (
                        <tr key={m.id}>
                          <td className="text-center font-monospace">{String(m.fecha).slice(0, 10)}</td>
                          <td className="text-center font-monospace fw-bold">{m.hora}</td>
                          <td className="text-center">
                            <span
                              className={`badge ${
                                m.tipo === 'ENTRADA' ? 'bg-success' : 'bg-primary'
                              } px-3 py-1`}
                            >
                              {m.tipo}
                            </span>
                          </td>
                          <td className="text-center">{m.dispositivo_nombre || 'Dispositivo Registrado'}</td>
                          <td className="text-center font-monospace small">{m.ip}</td>
                          <td className="text-center fw-semibold text-success">
                            {m.duracion_calculada ? `⏱️ ${m.duracion_calculada}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </Tabla>
                  )
                }
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: GESTIÓN DE DISPOSITIVOS AUTORIZADOS                */}
        {/* ============================================================== */}
        {tabActiva === 'dispositivos' && (
          <div className="row g-4 justify-content-center">
            {/* Formulario para registrar el navegador/dispositivo actual */}
            <div className="col-12 col-md-5">
              <Card
                responsivo={true}
                card_width="100%"
                titulo="Autorizar Este Navegador / Dispositivo"
                texto_alineado="left"
                chil_body={
                  <form onSubmit={guardarDispositivo}>
                    <p className="text-muted small mb-3">
                      Al registrar este dispositivo, se generará una cookie identificadora única que permitirá autorizar
                      tus marcas desde este navegador de forma segura.
                    </p>

                    <div className="mb-3">
                      <Input
                        label="Nombre del Dispositivo *"
                        placeholder="Ej. Laptop Trabajo Marco, PC Casa"
                        value={nuevoDispositivo.nombre}
                        onChange={(e) => setNuevoDispositivo({ ...nuevoDispositivo, nombre: e.target.value })}
                      />
                    </div>

                    <div className="mb-3">
                      <Input
                        label="Descripción u Observaciones"
                        placeholder="Ej. Google Chrome en Windows 11"
                        value={nuevoDispositivo.descripcion}
                        onChange={(e) => setNuevoDispositivo({ ...nuevoDispositivo, descripcion: e.target.value })}
                      />
                    </div>

                    {mensajeDispositivo && (
                      <div className="mb-3">
                        <Alert
                          color={mensajeDispositivo.tipo}
                          fondoBlanco={true}
                          texto={mensajeDispositivo.texto}
                          dismissible={true}
                          onDismiss={() => setMensajeDispositivo(null)}
                        />
                      </div>
                    )}

                    <Button
                      tipo="submit"
                      color="azul"
                      cargando={cargandoDispositivo}
                      className="w-100 fw-bold"
                      texto="💻 Autorizar Dispositivo Actual"
                    />
                  </form>
                }
              />
            </div>

            {/* Lista de Dispositivos Registrados */}
            <div className="col-12 col-md-7">
              <Card
                responsivo={true}
                card_width="100%"
                titulo="Dispositivos Autorizados Registrados"
                texto_alineado="left"
                chil_body={
                  dispositivos.length === 0 ? (
                    <p className="text-muted text-center py-3 mb-0">
                      No tienes ningún dispositivo registrado aún. Utiliza el formulario adyacente para autorizar tu equipo.
                    </p>
                  ) : (
                    <Tabla columnas={['Nombre', 'Descripción', 'Fecha Registro', 'Estado', 'Acciones']}>
                      {dispositivos.map((d) => (
                        <tr key={d.id}>
                          <td className="fw-bold">{d.nombre}</td>
                          <td className="small text-muted">{d.descripcion || 'Sin descripción'}</td>
                          <td className="small font-monospace">{new Date(d.fecha_registro).toLocaleDateString()}</td>
                          <td className="text-center">
                            <span className={`badge ${d.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}`}>
                              {d.estado}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                className={`btn btn-outline-${d.estado === 'ACTIVO' ? 'warning' : 'success'}`}
                                title={d.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                                onClick={() => toggleEstadoDispositivo(d.id, d.estado)}
                              >
                                {d.estado === 'ACTIVO' ? '⏸️ Inactivar' : '▶️ Activar'}
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                title="Eliminar"
                                onClick={() => handleEliminarDispositivo(d.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Tabla>
                  )
                }
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
