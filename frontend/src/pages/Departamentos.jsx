/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Departamentos.jsx
Autor: Jose Rodolfo Chaves Herrera
Fecha: 24/08/2026
Modulo: Frontend - Departamentos / Carreras
Descripcion:
Modulo CRUD completo para la administracion de Departamentos o Carreras
institucionales. Permite registrar, consultar, modificar y eliminar departamentos,
con verificacion de reglas de integridad (no permite eliminar departamentos que
tengan usuarios asignados).
//////////////////////////////////////////////////////////
*/

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { obtenerLinksNav } from '../utils/navLinks';
import {
  listarDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento,
} from '../api/departamentos.js';

import Navbar from '../components/Navbar.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Buttons.jsx';
import Alert from '../components/Alert.jsx';
import Input from '../components/Input.jsx';
import Tabla from '../components/Tabla.jsx';
import Titulo from '../components/Titulo.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Departamentos() {
  const { usuario, logout } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';

  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Estado del modal de crear / editar
  const [modalFormulario, setModalFormulario] = useState({
    abierto: false,
    esEdicion: false,
    id: null,
    nombre: '',
    descripcion: '',
    encargado: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  // Estado del modal de confirmación de eliminación
  const [modalEliminar, setModalEliminar] = useState({
    abierto: false,
    departamento: null,
  });

  // Cargar lista de departamentos
  const cargarDepartamentos = useCallback(async () => {
    setCargando(true);
    setError('');
    const res = await listarDepartamentos();
    setCargando(false);
    if (res.ok) {
      setDepartamentos(res.data || []);
    } else {
      setError(res.message || 'Error al cargar departamentos');
    }
  }, []);

  useEffect(() => {
    if (usuario && esAdmin) {
      cargarDepartamentos();
    }
  }, [usuario, esAdmin, cargarDepartamentos]);

  // Abrir modal para crear
  const abrirCrear = () => {
    setErrorModal('');
    setModalFormulario({
      abierto: true,
      esEdicion: false,
      id: null,
      nombre: '',
      descripcion: '',
      encargado: '',
    });
  };

  // Abrir modal para editar
  const abrirEditar = (depto) => {
    setErrorModal('');
    setModalFormulario({
      abierto: true,
      esEdicion: true,
      id: depto.id,
      nombre: depto.nombre || '',
      descripcion: depto.descripcion || '',
      encargado: depto.encargado || '',
    });
  };

  // Guardar (crear o actualizar)
  const manejarGuardar = async (e) => {
    e.preventDefault();
    setErrorModal('');

    if (!modalFormulario.nombre.trim()) {
      setErrorModal('El nombre del departamento es requerido.');
      return;
    }

    setGuardando(true);
    const datos = {
      nombre: modalFormulario.nombre.trim(),
      descripcion: modalFormulario.descripcion.trim(),
      encargado: modalFormulario.encargado.trim(),
    };

    let res;
    if (modalFormulario.esEdicion) {
      res = await actualizarDepartamento(modalFormulario.id, datos);
    } else {
      res = await crearDepartamento(datos);
    }
    setGuardando(false);

    if (!res.ok) {
      setErrorModal(res.message || 'Error al guardar departamento');
      return;
    }

    setExito(modalFormulario.esEdicion ? 'Departamento actualizado correctamente.' : 'Departamento creado correctamente.');
    setModalFormulario({ abierto: false, esEdicion: false, id: null, nombre: '', descripcion: '', encargado: '' });
    cargarDepartamentos();
  };

  // Confirmar y procesar eliminación
  const confirmarEliminar = async () => {
    const depto = modalEliminar.departamento;
    if (!depto) return;

    setError('');
    setExito('');
    setCargando(true);
    const res = await eliminarDepartamento(depto.id);
    setCargando(false);
    setModalEliminar({ abierto: false, departamento: null });

    if (!res.ok) {
      setError(res.message || 'Error al eliminar departamento');
      return;
    }

    setExito(`Departamento "${depto.nombre}" eliminado correctamente.`);
    cargarDepartamentos();
  };

  if (!usuario) return null;

  if (!esAdmin) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
        <Alert color="rojo" titulo="Acceso denegado." texto="No tiene permisos para administrar departamentos." />
      </div>
    );
  }

  const deptosFiltrados = departamentos.filter((d) => {
    const texto = `${d.nombre} ${d.descripcion || ''} ${d.encargado || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <>
      <Navbar
        color="azul"
        texto="SIGMA"
        navList={true}
        links={obtenerLinksNav(usuario, '/departamentos')}
        buttonContent={
          <Button
            color="rojo"
            tamano="pequeño"
            onClick={logout}
            texto="Cerrar sesion"
          />
        }
      />

      <div className="container-fluid px-4 py-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <Titulo tipografia="h2" texto="Gestión de Departamentos y Carreras" color_text="negro" />
            <p className="text-muted mb-0">Administra las unidades académicas y departamentos institucionales.</p>
          </div>
          <Button
            color="verde"
            texto="➕ Nuevo Departamento"
            onClick={abrirCrear}
          />
        </div>

        {error && <Alert color="rojo" fondoBlanco={true} texto={error} dismissible onDismiss={() => setError('')} />}
        {exito && <Alert color="verde" fondoBlanco={true} texto={exito} dismissible onDismiss={() => setExito('')} />}

        <Card
          responsivo={true}
          card_width="100%"
          titulo="Listado de Departamentos"
          chil_body={
            <>
              {/* Barra de Búsqueda */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <Input
                    label="Buscar departamento o encargado"
                    placeholder="Filtrar por nombre, descripción o encargado..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>

              {cargando ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                </div>
              ) : deptosFiltrados.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">
                  {departamentos.length === 0
                    ? 'No hay departamentos registrados. Haz clic en "Nuevo Departamento" para crear el primero.'
                    : 'No se encontraron departamentos que coincidan con la búsqueda.'}
                </p>
              ) : (
                <Tabla columnas={['ID', 'Nombre', 'Descripción', 'Encargado', 'Fecha Creación', 'Acciones']}>
                  {deptosFiltrados.map((d) => (
                    <tr key={d.id}>
                      <td className="font-monospace text-center">{d.id}</td>
                      <td className="fw-bold">{d.nombre}</td>
                      <td className="text-muted small">{d.descripcion || '—'}</td>
                      <td>{d.encargado || '—'}</td>
                      <td className="font-monospace small text-center">
                        {d.creado_en ? new Date(d.creado_en).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-primary"
                            title="Editar"
                            onClick={() => abrirEditar(d)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            title="Eliminar"
                            onClick={() => setModalEliminar({ abierto: true, departamento: d })}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Tabla>
              )}
            </>
          }
        />

        {/* ========== MODAL FORMULARIO (CREAR / EDITAR) ========== */}
        {modalFormulario.abierto && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0">
                <form onSubmit={manejarGuardar}>
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      {modalFormulario.esEdicion ? '✏️ Editar Departamento' : '➕ Registrar Nuevo Departamento'}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setModalFormulario({ ...modalFormulario, abierto: false })}
                    />
                  </div>
                  <div className="modal-body p-4">
                    {errorModal && (
                      <div className="mb-3">
                        <Alert color="rojo" fondoBlanco={true} texto={errorModal} />
                      </div>
                    )}

                    <div className="mb-3">
                      <Input
                        label="Nombre del Departamento o Carrera *"
                        placeholder="Ej. Tecnologías de Información, Administración"
                        value={modalFormulario.nombre}
                        onChange={(e) => setModalFormulario({ ...modalFormulario, nombre: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <Input
                        label="Descripción"
                        placeholder="Ej. Sede Guanacaste - Carrera de IT"
                        value={modalFormulario.descripcion}
                        onChange={(e) => setModalFormulario({ ...modalFormulario, descripcion: e.target.value })}
                      />
                    </div>

                    <div className="mb-3">
                      <Input
                        label="Encargado / Director de Carrera"
                        placeholder="Ej. Ing. Juan Pablo Rodríguez"
                        value={modalFormulario.encargado}
                        onChange={(e) => setModalFormulario({ ...modalFormulario, encargado: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <Button
                      color="gris"
                      texto="Cancelar"
                      disabled={guardando}
                      onClick={() => setModalFormulario({ ...modalFormulario, abierto: false })}
                    />
                    <Button
                      tipo="submit"
                      color="azul"
                      cargando={guardando}
                      texto={modalFormulario.esEdicion ? 'Guardar Cambios' : 'Registrar Departamento'}
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========== MODAL CONFIRMACIÓN ELIMINAR ========== */}
        {modalEliminar.abierto && modalEliminar.departamento && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Confirmar Eliminación
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setModalEliminar({ abierto: false, departamento: null })}
                  />
                </div>
                <div className="modal-body p-4">
                  <p className="mb-2">
                    ¿Está seguro de eliminar el departamento <strong>"{modalEliminar.departamento.nombre}"</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    <i className="bi bi-shield-lock me-1"></i>
                    El sistema comprobará que ningún usuario pertenezca a este departamento antes de procesar la eliminación.
                  </p>
                </div>
                <div className="modal-footer bg-light">
                  <Button
                    color="gris"
                    texto="Cancelar"
                    disabled={cargando}
                    onClick={() => setModalEliminar({ abierto: false, departamento: null })}
                  />
                  <Button
                    color="rojo"
                    cargando={cargando}
                    texto="🗑️ Sí, eliminar departamento"
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
