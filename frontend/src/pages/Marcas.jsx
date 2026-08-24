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
nombre de usuario y duracion laborada calculada.
//////////////////////////////////////////////////////////
*/

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { obtenerLinksNav } from '../utils/navLinks.js';
import { marcarAsistencia, obtenerEstadoActual, obtenerMisMarcas } from '../api/marcas.js';
import {
  registrarDispositivo,
  seleccionarDispositivo,
  deseleccionarDispositivo,
  obtenerMisDispositivos,
  cambiarEstadoDispositivo,
  eliminarDispositivo,
} from '../api/dispositivos.js';
import { obtenerRangoIp, actualizarRangoIp } from '../api/configuracion.js';

import Navbar from '../components/Navbar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Buttons.jsx';
import Alert from '../components/Alert.jsx';
import Input from '../components/Input.jsx';
import Tabla from '../components/Tabla.jsx';

export default function Marcas() {
  const { usuario, logout } = useAuth();

  // Pestaña activa ('asistencia', 'dispositivos', 'configuracion')
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
  const [modalEliminarDisp, setModalEliminarDisp] = useState({
    abierto: false,
    dispositivo: null,
    eliminando: false,
  });

  // Estado de Configuración IP (Solo Admin)
  const [rangoIp, setRangoIp] = useState('0.0.0.0/0');
  const [cargandoIpConfig, setCargandoIpConfig] = useState(false);
  const [mensajeIpConfig, setMensajeIpConfig] = useState(null);

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

  // Cargar configuración de IP (si es admin)
  const cargarConfiguracionIp = useCallback(async () => {
    const resIp = await obtenerRangoIp();
    if (resIp.ok && resIp.data) {
      setRangoIp(resIp.data.valor);
    }
  }, []);

  useEffect(() => {
    if (usuario) {
      cargarDatosMarcas();
      cargarDispositivos();
      if (usuario.rol === 'administrador') {
        cargarConfiguracionIp();
      }
    }
  }, [usuario, cargarDatosMarcas, cargarDispositivos, cargarConfiguracionIp]);

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

  // Seleccionar dispositivo para el navegador actual
  const handleSeleccionarDispositivo = async (id) => {
    const res = await seleccionarDispositivo(id);
    if (res.ok) {
      cargarDispositivos();
      cargarDatosMarcas();
      setMensajeDispositivo({ tipo: 'verde', texto: res.message });
    } else {
      setMensajeDispositivo({ tipo: 'rojo', texto: res.message });
    }
  };

  // Desmarcar / Desvincular dispositivo del navegador actual
  const handleDeseleccionarDispositivo = async () => {
    const res = await deseleccionarDispositivo();
    if (res.ok) {
      cargarDispositivos();
      cargarDatosMarcas();
      setMensajeDispositivo({ tipo: 'verde', texto: 'Dispositivo desmarcado de este navegador.' });
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
  const confirmarEliminarDispositivo = async () => {
    const disp = modalEliminarDisp.dispositivo;
    if (!disp) return;

    setModalEliminarDisp((prev) => ({ ...prev, eliminando: true }));
    const res = await eliminarDispositivo(disp.id);
    setModalEliminarDisp({ abierto: false, dispositivo: null, eliminando: false });

    if (res.ok) {
      cargarDispositivos();
      cargarDatosMarcas();
    } else {
      setMensajeDispositivo({ tipo: 'rojo', texto: res.message || 'Error al eliminar el dispositivo' });
    }
  };

  // Actualizar rango de IP permitido (Administrador)
  const guardarRangoIp = async (e) => {
    e.preventDefault();
    setMensajeIpConfig(null);

    const valor = rangoIp.trim();

    // Validar formato: IP simple, CIDR (x.x.x.x/n), comodín o múltiples separados por coma
    const patronIp = /^(\d{1,3}\.){3}\d{1,3}$/;
    const patronCidr = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    const esComodin = valor === '*' || valor === '0.0.0.0/0';

    const fragmentos = valor.split(',').map((f) => f.trim()).filter(Boolean);

    if (fragmentos.length === 0) {
      setMensajeIpConfig({ tipo: 'rojo', texto: 'El campo de rango IP no puede estar vacío.' });
      return;
    }

    const todosValidos = fragmentos.every((f) => {
      if (f === '*' || f === '0.0.0.0/0' || f === '::1') return true;
      if (patronIp.test(f)) {
        // Verificar que cada octeto sea 0-255
        return f.split('.').every((oct) => Number(oct) >= 0 && Number(oct) <= 255);
      }
      if (patronCidr.test(f)) {
        const [ip, prefijo] = f.split('/');
        const prefijoNum = Number(prefijo);
        const octetos = ip.split('.');
        return (
          prefijoNum >= 0 && prefijoNum <= 32 &&
          octetos.every((oct) => Number(oct) >= 0 && Number(oct) <= 255)
        );
      }
      return false;
    });

    if (!todosValidos) {
      setMensajeIpConfig({
        tipo: 'rojo',
        texto: 'Formato de IP inválido. Use una IP (192.168.1.1), un rango CIDR (192.168.1.0/24) o varias separadas por coma.',
      });
      return;
    }

    setCargandoIpConfig(true);
    const res = await actualizarRangoIp(valor);
    setCargandoIpConfig(false);

    setMensajeIpConfig({
      tipo: res.ok ? 'verde' : 'rojo',
      texto: res.ok ? 'Rango de red IP actualizado correctamente.' : (res.message || 'Error al guardar el rango de IP.'),
    });

    if (res.ok) {
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
      {/* Navbar Estandar de la App */}
      <Navbar
        color="azul"
        texto="SIGMA"
        navList={true}
        links={obtenerLinksNav(usuario, '/marcas')}
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
            {usuario.rol === 'administrador' && (
              <button
                className={`btn btn-${tabActiva === 'configuracion' ? 'primary' : 'outline-primary'} px-4 py-2 fw-bold`}
                onClick={() => setTabActiva('configuracion')}
              >
                <i className="bi bi-gear me-2"></i> Configuración IP
              </button>
            )}
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
                        {estadoAsistencia === 'DENTRO' ? 'DENTRO (En Jornada)' : 'FUERA (Sin Marca Activa)'}
                      </span>
                    </div>

                    {/* Reloj en Vivo e IP */}
                    <div className="row justify-content-center g-3 my-2 text-center">
                      <div className="col-auto">
                        <div className="p-2 border rounded bg-light">
                          <small className="text-muted d-block">Hora Local Sistema</small>
                          <strong className="fs-5 text-dark">
                            <i className="bi bi-clock me-1"></i> {horaEnVivo}
                          </strong>
                        </div>
                      </div>
                      <div className="col-auto">
                        <div className="p-2 border rounded bg-light">
                          <small className="text-muted d-block">IP de Conexión</small>
                          <strong className="fs-5 text-dark me-2">{ipCliente}</strong>
                          {ipAutorizada ? (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i> Red Autorizada
                            </span>
                          ) : (
                            <span className="badge bg-danger">
                              <i className="bi bi-x-circle me-1"></i> Red No Permitida
                            </span>
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
                      >
                        <i className={`bi ${esEntrada ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right'} me-2`}></i>
                        {esEntrada ? 'MARCAR ENTRADA' : 'MARCAR SALIDA'}
                      </Button>
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
                        'Usuario',
                        'Fecha',
                        'Hora',
                        'Tipo de Marca',
                        'Dispositivo',
                        'Dirección IP',
                        'Tiempo Laborado',
                      ]}
                    >
                      {historialMarcas.map((m) => {
                        const duracion = m.duracion_calculada || m.duracion_laborada;
                        return (
                          <tr key={m.id}>
                            <td className="fw-bold align-middle">{m.usuario_nombre || usuario.nombre_completo}</td>
                            <td className="text-center font-monospace align-middle">{String(m.fecha).slice(0, 10)}</td>
                            <td className="text-center font-monospace fw-bold align-middle">{m.hora}</td>
                            <td className="text-center align-middle">
                              <span
                                className={`badge ${
                                  m.tipo === 'ENTRADA' ? 'bg-success' : 'bg-primary'
                                } px-3 py-1`}
                              >
                                {m.tipo}
                              </span>
                            </td>
                            <td className="text-center align-middle">{m.dispositivo_nombre || 'Dispositivo Registrado'}</td>
                            <td className="text-center font-monospace small align-middle">{m.ip}</td>
                            <td className="text-center fw-semibold text-success align-middle">
                              {duracion ? (
                                <span>
                                  <i className="bi bi-hourglass-split me-1"></i>
                                  {duracion}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}
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

                    <Button tipo="submit" color="azul" cargando={cargandoDispositivo} className="w-100 fw-bold">
                      <i className="bi bi-laptop me-2"></i> Autorizar Dispositivo Actual
                    </Button>
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
                        <tr
                          key={d.id}
                          className={d.es_actual ? 'bg-light border-start border-4 border-primary' : ''}
                        >
                          <td className="fw-bold align-middle text-dark">
                            {d.nombre}
                            {d.es_actual && (
                              <span className="badge bg-primary text-white ms-2 shadow-sm">
                                <i className="bi bi-laptop me-1"></i> Este Navegador
                              </span>
                            )}
                          </td>
                          <td className="small text-muted align-middle">{d.descripcion || 'Sin descripción'}</td>
                          <td className="small font-monospace align-middle text-dark">
                            {new Date(d.fecha_registro).toLocaleDateString()}
                          </td>
                          <td className="text-center align-middle">
                            <span className={`badge ${d.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}`}>
                              {d.estado}
                            </span>
                          </td>
                          <td className="text-center align-middle" style={{ whiteSpace: 'nowrap', minWidth: '270px' }}>
                            <div className="d-flex justify-content-center gap-2 align-items-center">
                              <Button
                                color="azul"
                                tamano="pequeño"
                                texto="Seleccionar"
                                disabled={d.es_actual || d.estado !== 'ACTIVO'}
                                title={
                                  d.es_actual
                                    ? 'Ya está en uso en este navegador'
                                    : d.estado !== 'ACTIVO'
                                    ? 'Activa el dispositivo primero'
                                    : 'Usar en este navegador'
                                }
                                onClick={() => handleSeleccionarDispositivo(d.id)}
                              />
                              <Button
                                color={d.estado === 'ACTIVO' ? 'amarillo' : 'verde'}
                                tamano="pequeño"
                                texto={d.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                                onClick={() => toggleEstadoDispositivo(d.id, d.estado)}
                              />
                              <Button
                                color="rojo"
                                tamano="pequeño"
                                texto="Eliminar"
                                onClick={() => setModalEliminarDisp({ abierto: true, dispositivo: d, eliminando: false })}
                              />
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

        {/* ============================================================== */}
        {/* PESTAÑA 3: CONFIGURACIÓN IP (SOLO ADMINISTRADOR)              */}
        {/* ============================================================== */}
        {tabActiva === 'configuracion' && usuario.rol === 'administrador' && (
          <div className="row justify-content-center">
            <div className="col-12 col-md-6">
              <Card
                responsivo={true}
                card_width="100%"
                titulo="Configuración de Red IP Autorizada"
                texto_alineado="left"
                chil_body={
                  <form onSubmit={guardarRangoIp}>
                    <p className="text-muted small mb-3">
                      Establezca la dirección IP o notación CIDR permitida para registrar marcas (ej. <code>0.0.0.0/0</code>{' '}
                      permite cualquier red, <code>127.0.0.1</code> solo local, o <code>192.168.1.0/24</code>).
                    </p>

                    <div className="mb-3">
                      <Input
                        label="Rango de IP Permitido (rango_ip_permitido) *"
                        placeholder="Ej. 0.0.0.0/0 o 192.168.1.0/24"
                        value={rangoIp}
                        onChange={(e) => setRangoIp(e.target.value)}
                      />
                    </div>

                    {mensajeIpConfig && (
                      <div className="mb-3">
                        <Alert
                          color={mensajeIpConfig.tipo}
                          fondoBlanco={true}
                          texto={mensajeIpConfig.texto}
                          dismissible={true}
                          onDismiss={() => setMensajeIpConfig(null)}
                        />
                      </div>
                    )}

                    <Button tipo="submit" color="azul" cargando={cargandoIpConfig} className="w-100 fw-bold">
                      <i className="bi bi-shield-lock me-2"></i> Guardar Rango de IP
                    </Button>
                  </form>
                }
              />
            </div>
          </div>
        )}
        {/* ========== MODAL CONFIRMACIÓN ELIMINAR DISPOSITIVO ========== */}
        {modalEliminarDisp.abierto && modalEliminarDisp.dispositivo && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title mb-0">Confirmar Eliminación de Dispositivo</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setModalEliminarDisp({ abierto: false, dispositivo: null, eliminando: false })}
                  ></button>
                </div>
                <div className="modal-body py-4">
                  <p className="mb-2 fs-6">
                    ¿Está seguro de eliminar el dispositivo autorizado <strong>"{modalEliminarDisp.dispositivo.nombre}"</strong>?
                  </p>
                  <p className="small text-muted mb-0">
                    Descripción: {modalEliminarDisp.dispositivo.descripcion || 'Sin descripción'}. Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="modal-footer bg-light">
                  <Button
                    color="gris"
                    tamano="pequeño"
                    texto="Cancelar"
                    disabled={modalEliminarDisp.eliminando}
                    onClick={() => setModalEliminarDisp({ abierto: false, dispositivo: null, eliminando: false })}
                  />
                  <Button
                    color="rojo"
                    tamano="pequeño"
                    texto="Eliminar"
                    cargando={modalEliminarDisp.eliminando}
                    onClick={confirmarEliminarDispositivo}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
