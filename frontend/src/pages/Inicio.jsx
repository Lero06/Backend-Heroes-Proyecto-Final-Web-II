/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Inicio.jsx
Autor: Jose Rodolfo Chaves Herrera
Fecha: 24/08/2026
Modulo: Frontend - Panel Principal / Dashboard
Descripcion:
Dashboard interactivo principal que se muestra tras iniciar sesion.
Proporciona informacion en vivo del usuario, reloj sincronizado, widget
de control de asistencia rapida (1-click marca entrada/salida), indicadores
resumen del sistema (inventario de equipos, prestamos activos, departamentos)
y atajos directos a operaciones frecuentes segun el rol autenticado.
//////////////////////////////////////////////////////////
*/

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerLinksNav } from '../utils/navLinks';
import { obtenerEstadoActual, marcarAsistencia } from '../api/marcas';
import { obtenerMisDispositivos } from '../api/dispositivos';
import { listarEquipos } from '../api/equipos';
import { listarPrestamos } from '../api/prestamos';
import { listarDepartamentos } from '../api/departamentos';

import Navbar from '../components/Navbar';
import Titulo from '../components/Titulo';
import Card from '../components/Card';
import Button from '../components/Buttons';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const LOCAL_STORAGE_DEVICE_KEY = 'sigma_dispositivo_activo_id';

export default function Inicio() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const esAdmin = usuario?.rol === 'administrador';

  // Reloj y fecha
  const [horaEnVivo, setHoraEnVivo] = useState(new Date().toLocaleTimeString());
  const [fechaHoyTexto] = useState(
    new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );

  // Estado de asistencia rápida
  const [estadoAsistencia, setEstadoAsistencia] = useState(null);
  const [cargandoMarca, setCargandoMarca] = useState(false);
  const [mensajeMarca, setMensajeMarca] = useState(null);
  const [dispositivos, setDispositivos] = useState([]);
  const [dispositivoActivoId, setDispositivoActivoId] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_DEVICE_KEY) || ''
  );

  // Métricas del sistema (para administradores o usuarios)
  const [cargandoMetricas, setCargandoMetricas] = useState(true);
  const [metricas, setMetricas] = useState({
    totalEquipos: 0,
    equiposDisponibles: 0,
    equiposPrestados: 0,
    equiposMantenimiento: 0,
    prestamosActivos: 0,
    totalDepartamentos: 0,
  });

  // Reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => setHoraEnVivo(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar estado de marcas y dispositivos
  const cargarEstadoMarcas = useCallback(async () => {
    const res = await obtenerEstadoActual();
    if (res.ok) setEstadoAsistencia(res.data);

    const resDisp = await obtenerMisDispositivos();
    if (resDisp.ok) {
      const lista = resDisp.data || [];
      setDispositivos(lista);

      const almacenado = localStorage.getItem(LOCAL_STORAGE_DEVICE_KEY);
      const dispValido = lista.find((d) => d.id === almacenado && d.estado === 'ACTIVO');
      if (dispValido) {
        setDispositivoActivoId(dispValido.id);
      } else {
        const primerActivo = lista.find((d) => d.estado === 'ACTIVO');
        if (primerActivo) {
          setDispositivoActivoId(primerActivo.id);
          localStorage.setItem(LOCAL_STORAGE_DEVICE_KEY, primerActivo.id);
        }
      }
    }
  }, []);

  // Cargar métricas del sistema
  const cargarMetricas = useCallback(async () => {
    setCargandoMetricas(true);
    try {
      if (esAdmin) {
        const [resEq, resPres, resDept] = await Promise.all([
          listarEquipos(),
          listarPrestamos({ estado: 'ACTIVO' }),
          listarDepartamentos(),
        ]);

        const equiposLista = resEq.ok && Array.isArray(resEq.data) ? resEq.data : [];
        const prestamosLista = resPres.ok && Array.isArray(resPres.data) ? resPres.data : [];
        const deptosLista = resDept.ok && Array.isArray(resDept.data) ? resDept.data : [];

        setMetricas({
          totalEquipos: equiposLista.length,
          equiposDisponibles: equiposLista.filter((e) => e.estado === 'DISPONIBLE').length,
          equiposPrestados: equiposLista.filter((e) => e.estado === 'PRESTADO').length,
          equiposMantenimiento: equiposLista.filter((e) => e.estado === 'MANTENIMIENTO').length,
          prestamosActivos: prestamosLista.length,
          totalDepartamentos: deptosLista.length,
        });
      } else {
        const resEq = await listarEquipos();
        const equiposLista = resEq.ok && Array.isArray(resEq.data) ? resEq.data : [];
        setMetricas((prev) => ({
          ...prev,
          totalEquipos: equiposLista.length,
          equiposDisponibles: equiposLista.filter((e) => e.estado === 'DISPONIBLE').length,
        }));
      }
    } catch {
      // metricas silenciosas
    } finally {
      setCargandoMetricas(false);
    }
  }, [esAdmin]);

  useEffect(() => {
    if (usuario) {
      cargarEstadoMarcas();
      cargarMetricas();
    }
  }, [usuario, cargarEstadoMarcas, cargarMetricas]);

  // Ejecutar Marca Rápida desde el Dashboard
  const ejecutarMarcaRapida = async () => {
    setMensajeMarca(null);

    if (dispositivos.length === 0) {
      setMensajeMarca({
        tipo: 'rojo',
        texto: 'No tienes dispositivos registrados. Ve al módulo de Marcas para autorizar tu equipo.',
      });
      return;
    }

    if (!dispositivoActivoId) {
      setMensajeMarca({
        tipo: 'rojo',
        texto: 'No hay un dispositivo activo seleccionado.',
      });
      return;
    }

    setCargandoMarca(true);
    const res = await marcarAsistencia(dispositivoActivoId);
    setCargandoMarca(false);

    setMensajeMarca({
      tipo: res.ok ? 'verde' : 'rojo',
      texto: res.message,
    });

    if (res.ok) {
      cargarEstadoMarcas();
    }
  };

  if (!usuario) return null;

  const esEntrada = estadoAsistencia?.siguiente_marca_sugerida === 'ENTRADA';
  const dentroJornada = estadoAsistencia?.estado_asistencia === 'DENTRO';
  const ipCliente = estadoAsistencia?.ip_cliente || 'Detectando...';
  const ipValida = estadoAsistencia?.ip_autorizada ?? true;
  const dispActivoObj = dispositivos.find((d) => d.id === dispositivoActivoId);

  return (
    <>
      <Navbar
        color="azul"
        texto="SIGMA"
        navList={true}
        links={obtenerLinksNav(usuario, '/')}
        buttonContent={
          <Button color="rojo" tamano="pequeño" onClick={logout} texto="Cerrar sesion" />
        }
      />

      <div className="container-fluid px-4 py-2">
        <div className="mb-4">
          <Titulo
            tipografia="h2"
            texto={`Panel Principal — ${usuario.nombre_completo || usuario.usuario}`}
            color_text="negro"
          />
          <p className="text-muted mb-0">
            {fechaHoyTexto.charAt(0).toUpperCase() + fechaHoyTexto.slice(1)} • Rol: <strong className="text-capitalize">{usuario.rol}</strong>
          </p>
        </div>

        {/* ============================================================== */}
        {/* FILA 1: WIDGET DE ASISTENCIA RÁPIDA + ACCESOS CLAVE            */}
        {/* ============================================================== */}
        <div className="row g-4 mb-4">
          {/* Widget de Asistencia en Vivo */}
          <div className="col-12 col-lg-6">
            <Card
              responsivo={true}
              card_width="100%"
              titulo="Control de Asistencia Rápida"
              chil_body={
                <div className="p-2">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                      <small className="text-muted d-block">Estado actual de jornada:</small>
                      <span
                        className={`badge ${
                          dentroJornada ? 'bg-success' : 'bg-secondary'
                        } fs-6 px-3 py-2 rounded-pill`}
                      >
                        {dentroJornada ? 'DENTRO (En Jornada)' : 'FUERA (Sin Marca Activa)'}
                      </span>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Red IP:</small>
                      <span className="font-monospace small">
                        {ipCliente}{' '}
                        {ipValida ? (
                          <span className="badge bg-success">✓</span>
                        ) : (
                          <span className="badge bg-danger">✕</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {dispActivoObj && (
                    <div className="p-2 mb-3 bg-light rounded border d-flex justify-content-between align-items-center small">
                      <span>
                        <i className="bi bi-laptop me-1 text-primary"></i>
                        Dispositivo: <strong>{dispActivoObj.nombre}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn btn-link p-0 small text-decoration-none"
                        onClick={() => navigate('/marcas')}
                      >
                        Cambiar en Marcas →
                      </button>
                    </div>
                  )}

                  {mensajeMarca && (
                    <div className="mb-3">
                      <Alert
                        color={mensajeMarca.tipo}
                        fondoBlanco={true}
                        texto={mensajeMarca.texto}
                        dismissible={true}
                        onDismiss={() => setMensajeMarca(null)}
                      />
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Button
                      color={esEntrada ? 'verde' : 'rojo'}
                      tamano="mediano"
                      cargando={cargandoMarca}
                      disabled={!ipValida}
                      onClick={ejecutarMarcaRapida}
                      className="flex-grow-1 py-2 fw-bold"
                      texto={esEntrada ? 'Registrar ENTRADA' : 'Registrar SALIDA'}
                    />
                    <Button
                      color="azul"
                      texto="Ver Historial"
                      onClick={() => navigate('/marcas')}
                    />
                  </div>
                </div>
              }
            />
          </div>

          {/* Tarjeta de Atajos Rápidos */}
          <div className="col-12 col-lg-6">
            <Card
              responsivo={true}
              card_width="100%"
              titulo="Acciones Rápidas del Sistema"
              chil_body={
                <div className="row g-2 p-1">
                  <div className="col-6">
                    <button
                      className="btn btn-outline-primary w-100 p-3 text-start d-flex align-items-center gap-3 h-100"
                      onClick={() => navigate('/equipos')}
                    >
                      <i className="bi bi-laptop-fill fs-2 text-primary"></i>
                      <div>
                        <div className="fw-bold">Inventario</div>
                        <small className="text-muted">Equipos y catálogo</small>
                      </div>
                    </button>
                  </div>

                  {esAdmin && (
                    <div className="col-6">
                      <button
                        className="btn btn-outline-success w-100 p-3 text-start d-flex align-items-center gap-3 h-100"
                        onClick={() => navigate('/prestamos')}
                      >
                        <i className="bi bi-box-arrow-right fs-2 text-success"></i>
                        <div>
                          <div className="fw-bold">Préstamos</div>
                          <small className="text-muted">Prestar / Devolver</small>
                        </div>
                      </button>
                    </div>
                  )}

                  {esAdmin && (
                    <div className="col-6">
                      <button
                        className="btn btn-outline-info w-100 p-3 text-start d-flex align-items-center gap-3 h-100"
                        onClick={() => navigate('/departamentos')}
                      >
                        <i className="bi bi-diagram-3-fill fs-2 text-info"></i>
                        <div>
                          <div className="fw-bold">Departamentos</div>
                          <small className="text-muted">Carreras y áreas</small>
                        </div>
                      </button>
                    </div>
                  )}

                  {esAdmin && (
                    <div className="col-6">
                      <button
                        className="btn btn-outline-warning w-100 p-3 text-start d-flex align-items-center gap-3 h-100"
                        onClick={() => navigate('/reportes')}
                      >
                        <i className="bi bi-file-earmark-bar-graph-fill fs-2 text-warning"></i>
                        <div>
                          <div className="fw-bold">Reportes</div>
                          <small className="text-muted">Exportar marcas</small>
                        </div>
                      </button>
                    </div>
                  )}

                  {esAdmin && (
                    <div className="col-6">
                      <button
                        className="btn btn-outline-dark w-100 p-3 text-start d-flex align-items-center gap-3 h-100"
                        onClick={() => navigate('/configuracion')}
                      >
                        <i className="bi bi-gear-fill fs-2 text-dark"></i>
                        <div>
                          <div className="fw-bold">Configuración</div>
                          <small className="text-muted">IPs y parámetros</small>
                        </div>
                      </button>
                    </div>
                  )}

                  <div className="col-6">
                    <button
                      className="btn btn-outline-secondary w-100 p-3 text-start d-flex align-items-center gap-3 h-100"
                      onClick={() => navigate('/perfil')}
                    >
                      <i className="bi bi-person-circle fs-2 text-secondary"></i>
                      <div>
                        <div className="fw-bold">Mi Perfil</div>
                        <small className="text-muted">Datos y contraseña</small>
                      </div>
                    </button>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* FILA 2: RESUMEN DE MÉTRICAS OPERATIVAS                         */}
        {/* ============================================================== */}
        <h4 className="fw-bold text-secondary mb-3">
          <i className="bi bi-speedometer2 me-2"></i>
          Resumen Operativo
        </h4>

        {cargandoMetricas ? (
          <div className="text-center py-4">
            <Spinner color="primary" />
          </div>
        ) : esAdmin ? (
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
                <div className="card-body">
                  <div className="text-muted small text-uppercase fw-bold">Total Equipos</div>
                  <div className="fs-2 fw-bold text-dark mt-1">{metricas.totalEquipos}</div>
                  <small className="text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    {metricas.equiposDisponibles} disponibles
                  </small>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
                <div className="card-body">
                  <div className="text-muted small text-uppercase fw-bold">Préstamos Activos</div>
                  <div className="fs-2 fw-bold text-success mt-1">{metricas.prestamosActivos}</div>
                  <small className="text-muted">
                    {metricas.equiposPrestados} equipos prestados
                  </small>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm border-0 border-start border-info border-4 h-100">
                <div className="card-body">
                  <div className="text-muted small text-uppercase fw-bold">Departamentos</div>
                  <div className="fs-2 fw-bold text-info mt-1">{metricas.totalDepartamentos}</div>
                  <small className="text-muted">Unidades registradas</small>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm border-0 border-start border-warning border-4 h-100">
                <div className="card-body">
                  <div className="text-muted small text-uppercase fw-bold">Mantenimiento</div>
                  <div className="fs-2 fw-bold text-warning mt-1">{metricas.equiposMantenimiento}</div>
                  <small className="text-muted">Equipos en revisión</small>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
                <div className="card-body">
                  <div className="text-muted small text-uppercase fw-bold">Equipos Disponibles</div>
                  <div className="fs-2 fw-bold text-primary mt-1">{metricas.equiposDisponibles}</div>
                  <small className="text-muted">Listos para solicitar préstamo</small>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card shadow-sm border-0 border-start border-info border-4 h-100">
                <div className="card-body">
                  <div className="text-muted small text-uppercase fw-bold">Mis Dispositivos</div>
                  <div className="fs-2 fw-bold text-info mt-1">{dispositivos.length}</div>
                  <small className="text-muted">Autorizados para marcar</small>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
                <div className="card-body">
                  <div className="text-muted small text-uppercase fw-bold">Estado de Asistencia</div>
                  <div className="fs-4 fw-bold text-success mt-2">
                    {dentroJornada ? 'En Jornada' : 'Fuera de Jornada'}
                  </div>
                  <small className="text-muted">Marca actual: {horaEnVivo}</small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
