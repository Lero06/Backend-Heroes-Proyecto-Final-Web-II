/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Prestamos.jsx
Autor: Dennis Marchena Delgado
Fecha: 21/08/2026
Modulo: Frontend - Prestamos y Devoluciones
Descripcion:
Pantalla principal del módulo de préstamos. Permite crear un nuevo
préstamo (seleccionando usuario y equipos), ver la lista de préstamos
activos y pasados, ver detalles, y realizar devoluciones (individuales
o completas). También incluye un historial con filtros.
//////////////////////////////////////////////////////////
*/

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerLinksNav } from '../utils/navLinks';
import {
  obtenerDatosIniciales,
  crearPrestamo,
  listarPrestamos,
  obtenerPrestamo,
  devolverEquipos,
  historialPorUsuario,
} from '../api/prestamos';
import Navbar from '../components/Navbar';
import Titulo from '../components/Titulo';
import Card from '../components/Card';
import Button from '../components/Buttons';
import Alert from '../components/Alert';
import Tabla from '../components/Tabla';
import Select from '../components/Select';
import Input from '../components/Input';
import Spinner from '../components/Spinner';

export default function Prestamos() {
  const { usuario, logout } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';

  // Estados globales
  const [usuarios, setUsuarios] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Estado del formulario de creación
  const [nuevoPrestamo, setNuevoPrestamo] = useState({ usuario_id: '', equipos_ids: [] });
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');

  // Estado para detalles y modal de confirmación de devolución
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [modalDevolucion, setModalDevolucion] = useState({
    abierto: false,
    prestamoId: null,
    equiposIds: [],
    equiposInfo: [],
  });

  // Filtros para listar
  const [filtros, setFiltros] = useState({ usuario_id: '', estado: '', fecha_inicio: '', fecha_fin: '' });

  // Cargar datos iniciales (usuarios y equipos)
  const cargarDatosIniciales = useCallback(async () => {
    const res = await obtenerDatosIniciales();
    if (res.ok) {
      setUsuarios(res.data.usuarios || []);
      setEquiposDisponibles(res.data.equipos || []);
    } else {
      setError('No se pudieron cargar los datos iniciales.');
    }
  }, []);

  // Cargar lista de préstamos con filtros
  const cargarPrestamos = useCallback(async () => {
    setCargando(true);
    setError('');
    const res = await listarPrestamos(filtros);
    setCargando(false);
    if (res.ok) {
      setPrestamos(res.data || []);
    } else {
      setError(res.message || 'Error al cargar préstamos');
    }
  }, [filtros]);

  useEffect(() => {
    if (usuario) {
      cargarDatosIniciales();
      cargarPrestamos();
    }
  }, [usuario, cargarDatosIniciales, cargarPrestamos]);

  // Manejar creación de préstamo
  const manejarAgregarEquipo = () => {
    if (!equipoSeleccionado) return;
    const id = Number(equipoSeleccionado);
    if (nuevoPrestamo.equipos_ids.includes(id)) {
      setError('El equipo ya está en la lista.');
      return;
    }
    setNuevoPrestamo({
      ...nuevoPrestamo,
      equipos_ids: [...nuevoPrestamo.equipos_ids, id],
    });
    setEquipoSeleccionado('');
    setError('');
  };

  const manejarQuitarEquipo = (id) => {
    setNuevoPrestamo({
      ...nuevoPrestamo,
      equipos_ids: nuevoPrestamo.equipos_ids.filter(eqId => eqId !== id),
    });
  };

  const manejarCrearPrestamo = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    if (!nuevoPrestamo.usuario_id) {
      setError('Debe seleccionar un usuario.');
      return;
    }
    if (nuevoPrestamo.equipos_ids.length === 0) {
      setError('Debe agregar al menos un equipo.');
      return;
    }
    setCargando(true);
    const res = await crearPrestamo(nuevoPrestamo);
    setCargando(false);
    if (!res.ok) {
      setError(res.message || 'Error al crear préstamo');
      return;
    }
    setExito('Préstamo creado exitosamente.');
    setNuevoPrestamo({ usuario_id: '', equipos_ids: [] });
    setEquipoSeleccionado('');
    await Promise.all([cargarDatosIniciales(), cargarPrestamos()]);
  };

  // Ver detalle de un préstamo
  const verDetalle = async (id) => {
    const res = await obtenerPrestamo(id);
    if (res.ok) {
      setPrestamoSeleccionado(res.data);
      setMostrarDetalle(true);
    } else {
      setError(res.message || 'Error al obtener detalle');
    }
  };

  // Abrir modal de confirmación de devolución
  const solicitarDevolucion = (prestamoId, equipos) => {
    setModalDevolucion({
      abierto: true,
      prestamoId,
      equiposIds: equipos.map(e => e.equipo_id),
      equiposInfo: equipos,
    });
  };

  // Confirmar y procesar devolución
  const confirmarDevolucion = async () => {
    const { prestamoId, equiposIds } = modalDevolucion;
    if (!prestamoId || equiposIds.length === 0) return;

    setError('');
    setExito('');
    setCargando(true);
    const res = await devolverEquipos(prestamoId, equiposIds);
    setCargando(false);
    setModalDevolucion({ abierto: false, prestamoId: null, equiposIds: [], equiposInfo: [] });

    if (!res.ok) {
      setError(res.message || 'Error al devolver equipos');
      return;
    }

    setExito('Devolución registrada correctamente.');
    setMostrarDetalle(false);
    setPrestamoSeleccionado(null);
    await Promise.all([cargarDatosIniciales(), cargarPrestamos()]);
  };

  // Renderizado condicional de seguridad (admin)
  if (!usuario) return null;
  if (!esAdmin) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
        <Alert color="rojo" titulo="Acceso denegado." texto="No tiene permisos para ver esta sección." />
      </div>
    );
  }

  return (
    <>
      <Navbar
        color="azul"
        texto="SIGMA"
        navList
        links={obtenerLinksNav(usuario, '/prestamos')}
      />

      <div className="container-fluid px-4">
        <Titulo tipografia="h2" texto="Módulo de Préstamos y Devoluciones" color_text="negro" alineado="centro" />

        {error && <Alert color="rojo" fondoBlanco texto={error} dismissible onDismiss={() => setError('')} />}
        {exito && <Alert color="verde" fondoBlanco texto={exito} dismissible onDismiss={() => setExito('')} />}

        {/* ========== FORMULARIO DE CREACIÓN ========== */}
        <Card
          responsivo
          card_width="100%"
          titulo="Nuevo Préstamo"
          chil_body={
            <form onSubmit={manejarCrearPrestamo}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <Select
                    label="Usuario"
                    texto="Seleccione un usuario"
                    options={usuarios.map(u => ({ value: u.id, text: `${u.nombre_completo} (${u.usuario})` }))}
                    value={nuevoPrestamo.usuario_id}
                    onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, usuario_id: Number(e.target.value) })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex gap-2 align-items-end">
                    <div className="flex-grow-1">
                      <Select
                        label="Agregar Equipo"
                        texto={
                          equiposDisponibles.filter(eq => !nuevoPrestamo.equipos_ids.includes(eq.id)).length === 0
                            ? '— No hay más equipos disponibles —'
                            : 'Seleccione un equipo disponible'
                        }
                        options={equiposDisponibles
                          .filter(eq => !nuevoPrestamo.equipos_ids.includes(eq.id))
                          .map(eq => ({ value: eq.id, text: `${eq.codigo} - ${eq.descripcion}` }))}
                        value={equipoSeleccionado}
                        onChange={(e) => setEquipoSeleccionado(e.target.value)}
                      />
                    </div>
                    <Button type="button" color="azul" texto="Agregar" onClick={manejarAgregarEquipo} />
                  </div>
                  <div className="mt-2">
                    <strong>Equipos seleccionados ({nuevoPrestamo.equipos_ids.length}):</strong>
                    {nuevoPrestamo.equipos_ids.length === 0 ? (
                      <p className="text-muted small mb-0">No has agregado ningún equipo aún.</p>
                    ) : (
                      <ul className="list-unstyled mt-1">
                        {nuevoPrestamo.equipos_ids.map((id) => {
                          const eq = equiposDisponibles.find(e => e.id === id);
                          return (
                            <li key={id} className="d-flex justify-content-between align-items-center p-2 mb-1 border rounded bg-light">
                              <span><strong>{eq?.codigo}</strong> — {eq?.descripcion}</span>
                              <Button type="button" color="rojo" tamano="pequeño" texto="Quitar" onClick={() => manejarQuitarEquipo(id)} />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-2 d-flex align-items-end">
                  <Button type="submit" color="verde" cargando={cargando} texto="Crear Préstamo" className="w-100" />
                </div>
              </div>
            </form>
          }
        />

        {/* ========== LISTA DE PRÉSTAMOS ========== */}
        <Card
          responsivo
          card_width="100%"
          titulo="Lista de Préstamos"
          chil_body={
            <>
              <div className="row g-2 mb-3">
                <div className="col-md-3">
                  <Select
                    label="Usuario"
                    texto="Todos"
                    options={usuarios.map(u => ({ value: u.id, text: u.nombre_completo }))}
                    value={filtros.usuario_id}
                    onChange={(e) => setFiltros({ ...filtros, usuario_id: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <Select
                    label="Estado"
                    texto="Todos"
                    options={[{ value: 'ACTIVO', text: 'Activo' }, { value: 'FINALIZADO', text: 'Finalizado' }]}
                    value={filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <Input
                    label="Fecha inicio"
                    tipo="date"
                    value={filtros.fecha_inicio}
                    onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <Input
                    label="Fecha fin"
                    tipo="date"
                    value={filtros.fecha_fin}
                    onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end gap-2">
                  <Button color="azul" texto="Buscar" onClick={cargarPrestamos} />
                  <Button color="gris" texto="Limpiar" onClick={() => setFiltros({ usuario_id: '', estado: '', fecha_inicio: '', fecha_fin: '' })} />
                </div>
              </div>

              {cargando ? (
                <div className="text-center py-4"><Spinner color="primary" /></div>
              ) : prestamos.length === 0 ? (
                <p className="text-muted">No hay préstamos con esos filtros.</p>
              ) : (
                <Tabla columnas={['ID', 'Usuario', 'Encargado', 'Fecha', 'Estado', 'Equipos', 'Acciones']}>
                  {prestamos.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.usuario_nombre}</td>
                      <td>{p.encargado_nombre}</td>
                      <td>{new Date(p.fecha).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${p.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td>{p.devueltos}/{p.total_equipos}</td>
                      <td>
                        <Button color="celeste" tamano="pequeño" texto="Ver" onClick={() => verDetalle(p.id)} />
                      </td>
                    </tr>
                  ))}
                </Tabla>
              )}
            </>
          }
        />

        {/* ========== MODAL / DETALLE DE PRÉSTAMO ========== */}
        {mostrarDetalle && prestamoSeleccionado && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Detalle del Préstamo #{prestamoSeleccionado.id}</h5>
                  <button type="button" className="btn-close" onClick={() => setMostrarDetalle(false)} />
                </div>
                <div className="modal-body">
                  <p><strong>Usuario:</strong> {prestamoSeleccionado.usuario_nombre}</p>
                  <p><strong>Encargado:</strong> {prestamoSeleccionado.encargado_nombre}</p>
                  <p><strong>Fecha:</strong> {new Date(prestamoSeleccionado.fecha).toLocaleString()}</p>
                  <p><strong>Estado:</strong> {prestamoSeleccionado.estado}</p>
                  <h6>Equipos:</h6>
                  <Tabla columnas={['Código', 'Descripción', 'Estado Devolución', 'Fecha Devolución', 'Acción']}>
                    {prestamoSeleccionado.detalles.map(d => (
                      <tr key={d.id}>
                        <td>{d.codigo}</td>
                        <td>{d.descripcion}</td>
                        <td>
                          <span className={`badge ${d.estado_devolucion === 'DEVUELTO' ? 'bg-success' : 'bg-warning'}`}>
                            {d.estado_devolucion}
                          </span>
                        </td>
                        <td>{d.fecha_devolucion ? new Date(d.fecha_devolucion).toLocaleDateString() : '-'}</td>
                        <td>
                          {d.estado_devolucion === 'PENDIENTE' && prestamoSeleccionado.estado === 'ACTIVO' && (
                            <Button
                              color="verde"
                              tamano="pequeño"
                              texto="Devolver"
                              onClick={() => solicitarDevolucion(prestamoSeleccionado.id, [d])}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </Tabla>
                </div>
                <div className="modal-footer">
                  {prestamoSeleccionado.estado === 'ACTIVO' && prestamoSeleccionado.detalles.some(d => d.estado_devolucion === 'PENDIENTE') && (
                    <Button
                      color="verde"
                      texto="Devolver todos los pendientes"
                      onClick={() => {
                        const pendientes = prestamoSeleccionado.detalles.filter(d => d.estado_devolucion === 'PENDIENTE');
                        solicitarDevolucion(prestamoSeleccionado.id, pendientes);
                      }}
                    />
                  )}
                  <Button color="gris" texto="Cerrar" onClick={() => setMostrarDetalle(false)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== MODAL DE CONFIRMACIÓN DE DEVOLUCIÓN ========== */}
        {modalDevolucion.abierto && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Confirmar Devolución
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setModalDevolucion({ abierto: false, prestamoId: null, equiposIds: [], equiposInfo: [] })}
                  />
                </div>
                <div className="modal-body p-4">
                  <p className="mb-3">
                    ¿Está seguro de registrar la devolución de los siguientes <strong>{modalDevolucion.equiposIds.length}</strong> equipo(s)?
                  </p>
                  <ul className="list-group mb-3">
                    {modalDevolucion.equiposInfo.map((eq, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{eq.codigo}</strong>
                          <span className="text-muted small d-block">{eq.descripcion}</span>
                        </div>
                        <span className="badge bg-primary rounded-pill">Disponible tras devolver</span>
                      </li>
                    ))}
                  </ul>
                  <div className="alert alert-info py-2 small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Los equipos volverán al estado <strong>DISPONIBLE</strong> inmediatamente.
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <Button
                    color="gris"
                    texto="Cancelar"
                    disabled={cargando}
                    onClick={() => setModalDevolucion({ abierto: false, prestamoId: null, equiposIds: [], equiposInfo: [] })}
                  />
                  <Button
                    color="verde"
                    cargando={cargando}
                    texto="✓ Sí, confirmar devolución"
                    onClick={confirmarDevolucion}
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