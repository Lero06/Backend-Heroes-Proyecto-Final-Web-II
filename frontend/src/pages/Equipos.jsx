/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Equipos.jsx
Autor: Jose Rodolfo Chaves Herrera
Fecha: 22/08/2026
Modulo: Frontend - Inventario de Equipos
Descripcion:
Pantalla de inventario de equipos. Cualquier usuario autenticado
puede consultarla y filtrar por estado; solo los administradores ven
las acciones de crear, editar, cambiar estado y eliminar. Un equipo
en estado PRESTADO nunca permite cambiar su estado ni eliminarse
desde aqui: eso es responsabilidad del modulo de Prestamos.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerLinksNav } from '../utils/navLinks';
import { listarEquipos, cambiarEstadoEquipo, eliminarEquipo, urlImagenEquipo } from '../api/equipos';
import Navbar from '../components/Navbar';
import Titulo from '../components/Titulo';
import Card from '../components/Card';
import Tabla from '../components/Tabla';
import Select from '../components/Select';
import Button from '../components/Buttons';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

// Estados que se pueden asignar manualmente desde esta pantalla.
// PRESTADO queda afuera a proposito: ese lo asigna el modulo de Prestamos.
const ESTADOS_MANUALES = ['DISPONIBLE', 'MANTENIMIENTO', 'INACTIVO'];

const BADGE_POR_ESTADO = {
  DISPONIBLE: 'text-bg-success',
  PRESTADO: 'text-bg-primary',
  MANTENIMIENTO: 'text-bg-warning',
  INACTIVO: 'text-bg-secondary',
};

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function Equipos() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const esAdmin = usuario?.rol === 'administrador';

  const [equipos, setEquipos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Estado del modal de confirmación de eliminación
  const [modalEliminar, setModalEliminar] = useState({
    abierto: false,
    equipo: null,
    eliminando: false,
  });

  /**
   * Carga el inventario aplicando el filtro de estado actual.
   */
  const cargarEquipos = useCallback(async () => {
    setCargando(true);
    setError('');
    const respuesta = await listarEquipos(filtroEstado);
    setCargando(false);

    if (!respuesta.ok) {
      setError(respuesta.message || 'No se pudo cargar el inventario');
      return;
    }
    setEquipos(respuesta.data);
  }, [filtroEstado]);

  useEffect(() => {
    cargarEquipos();
  }, [cargarEquipos]);

  /**
   * Cambia el estado de un equipo desde el selector rapido de la tabla.
   * @param {object} equipo - Equipo cuya fila disparo el cambio.
   * @param {string} nuevoEstado - Nuevo estado seleccionado.
   */
  const manejarCambioEstado = async (equipo, nuevoEstado) => {
    if (nuevoEstado === equipo.estado) return;

    setError('');
    setMensaje('');
    const respuesta = await cambiarEstadoEquipo(equipo.id, nuevoEstado);

    if (!respuesta.ok) {
      setError(respuesta.message || 'No se pudo cambiar el estado del equipo');
      return;
    }

    setMensaje(`Estado de "${equipo.codigo}" actualizado a ${nuevoEstado}.`);
    cargarEquipos();
  };

  /**
   * Confirma la eliminación de un equipo desde el modal.
   */
  const confirmarEliminar = async () => {
    const equipo = modalEliminar.equipo;
    if (!equipo) return;

    setError('');
    setMensaje('');
    setModalEliminar((prev) => ({ ...prev, eliminando: true }));

    const respuesta = await eliminarEquipo(equipo.id);
    setModalEliminar({ abierto: false, equipo: null, eliminando: false });

    if (!respuesta.ok) {
      setError(respuesta.message || 'No se pudo eliminar el equipo');
      return;
    }

    setMensaje(`Equipo "${equipo.codigo}" eliminado correctamente.`);
    cargarEquipos();
  };

  if (!usuario) return null; // RutaProtegida maneja el estado de carga

  return (
    <>
      <Navbar
        color="azul"
        texto="SIGMA"
        navList={true}
        links={obtenerLinksNav(usuario, '/equipos')}
        buttonContent={<Button color="rojo" tamano="pequeño" onClick={logout} texto="Cerrar sesion" />}
      />

      <div className="container-fluid px-4">
        <Titulo tipografia="h2" texto="Inventario de Equipos" color_text="negro" alineado="centro" />

        {/* ======== Filtro + accion de crear ======== */}
        <div className="mb-4">
          <Card
            responsivo={true}
            card_width="100%"
            color_texto="negro"
            texto_alineado="left"
            titulo="Filtros"
            chil_body={
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-4">
                  <Select
                    label="Estado"
                    texto="— Todos —"
                    options={ESTADOS_MANUALES.concat('PRESTADO').map((e) => ({ value: e, text: e }))}
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  />
                </div>
                {esAdmin && (
                  <div className="col-12 col-md-auto ms-md-auto">
                    <Button
                      color="verde"
                      texto="+ Nuevo equipo"
                      onClick={() => navigate('/equipos/nuevo')}
                    />
                  </div>
                )}
              </div>
            }
          />
        </div>

        {/* ======== Mensajes de estado ======== */}
        {error && <Alert color="rojo" fondoBlanco={true} texto={error} dismissible onDismiss={() => setError('')} />}
        {mensaje && !error && (
          <Alert color="verde" fondoBlanco={true} texto={mensaje} dismissible onDismiss={() => setMensaje('')} />
        )}

        {/* ======== Tabla de inventario ======== */}
        <Card
          responsivo={true}
          card_width="100%"
          color_texto="negro"
          texto_alineado="left"
          titulo="Equipos"
          chil_body={
            cargando ? (
              <div className="text-center py-4">
                <Spinner color="primary" />
              </div>
            ) : equipos.length === 0 ? (
              <p className="text-muted mb-0">No hay equipos registrados con ese filtro.</p>
            ) : (
              <Tabla columnas={['Imagen', 'Codigo', 'Descripcion', 'Estado', 'Acciones']}>
                {equipos.map((equipo) => {
                  const imagenUrl = urlImagenEquipo(equipo.imagen);
                  const estaPrestado = equipo.estado === 'PRESTADO';

                  return (
                    <tr key={equipo.id} style={{ color: '#000000' }}>
                      <td style={{ color: '#000000', width: 72 }}>
                        {imagenUrl ? (
                          <img
                            src={imagenUrl}
                            alt={equipo.codigo}
                            className="rounded"
                            style={{ width: 48, height: 48, objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center bg-light rounded text-muted"
                            style={{ width: 48, height: 48 }}
                          >
                            <i className="bi bi-image" />
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#000000' }} className="fw-semibold">
                        {equipo.codigo}
                      </td>
                      <td style={{ color: '#000000' }}>{equipo.descripcion}</td>
                      <td style={{ color: '#000000' }}>
                        <span className={`badge ${BADGE_POR_ESTADO[equipo.estado] || 'text-bg-secondary'}`}>
                          {equipo.estado}
                        </span>
                      </td>
                      <td style={{ color: '#000000' }}>
                        {esAdmin ? (
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <Button
                              color="azul"
                              tamano="pequeño"
                              texto="Editar"
                              onClick={() => navigate(`/equipos/${equipo.id}/editar`)}
                            />

                            <select
                              className="form-select form-select-sm"
                              style={{ width: 150 }}
                              value={equipo.estado}
                              disabled={estaPrestado}
                              title={
                                estaPrestado
                                  ? 'No se puede cambiar: el equipo esta prestado'
                                  : 'Cambiar estado'
                              }
                              onChange={(e) => manejarCambioEstado(equipo, e.target.value)}
                            >
                              {estaPrestado && <option value="PRESTADO">PRESTADO</option>}
                              {ESTADOS_MANUALES.map((estado) => (
                                <option key={estado} value={estado}>
                                  {estado}
                                </option>
                              ))}
                            </select>

                            <Button
                              color="rojo"
                              tamano="pequeño"
                              texto="Eliminar"
                              disabled={estaPrestado}
                              onClick={() => setModalEliminar({ abierto: true, equipo, eliminando: false })}
                            />
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </Tabla>
            )
          }
        />

        {/* ========== MODAL CONFIRMACIÓN ELIMINAR EQUIPO ========== */}
        {modalEliminar.abierto && modalEliminar.equipo && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title mb-0">Confirmar Eliminación de Equipo</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setModalEliminar({ abierto: false, equipo: null, eliminando: false })}
                  ></button>
                </div>
                <div className="modal-body py-4">
                  <p className="mb-2 fs-6">
                    ¿Está seguro de eliminar el equipo <strong>"{modalEliminar.equipo.codigo}"</strong>?
                  </p>
                  <p className="small text-muted mb-0">
                    Descripción: {modalEliminar.equipo.descripcion || 'Sin descripción'}. Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="modal-footer bg-light">
                  <Button
                    color="gris"
                    tamano="pequeño"
                    texto="Cancelar"
                    disabled={modalEliminar.eliminando}
                    onClick={() => setModalEliminar({ abierto: false, equipo: null, eliminando: false })}
                  />
                  <Button
                    color="rojo"
                    tamano="pequeño"
                    texto="Eliminar"
                    cargando={modalEliminar.eliminando}
                    onClick={confirmarEliminar}
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
