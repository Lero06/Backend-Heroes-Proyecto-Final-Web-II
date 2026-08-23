/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: EquipoForm.jsx
Autor: Jose Rodolfo Chaves Herrera
Fecha: 22/08/2026
Modulo: Frontend - Inventario de Equipos
Descripcion:
Formulario de registro y edicion de equipos, reutilizado para ambos
casos segun si la ruta trae un :id (edicion) o no (registro nuevo).
Permite subir la imagen del equipo por seleccion de archivo o por
Drag & Drop. Si el equipo esta actualmente PRESTADO, el campo de
estado se bloquea: ese cambio solo lo puede hacer el modulo de
Prestamos al registrar la devolucion.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerLinksNav } from '../utils/navLinks';
import { obtenerEquipo, crearEquipo, actualizarEquipo, urlImagenEquipo } from '../api/equipos';
import Navbar from '../components/Navbar';
import Titulo from '../components/Titulo';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Buttons';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const ESTADOS_MANUALES = ['DISPONIBLE', 'MANTENIMIENTO', 'INACTIVO'];
const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAX_MB = 5;

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function EquipoForm() {
  const { usuario, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const modoEdicion = Boolean(id);
  const inputArchivoRef = useRef(null);

  const [form, setForm] = useState({ codigo: '', descripcion: '', estado: 'DISPONIBLE' });
  const [imagenActual, setImagenActual] = useState(null); // nombre de archivo ya guardado (edicion)
  const [archivoNuevo, setArchivoNuevo] = useState(null); // File recien seleccionado
  const [previsualizacion, setPrevisualizacion] = useState(null); // URL de vista previa

  const [arrastrando, setArrastrando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(modoEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // ---- Carga los datos del equipo cuando estamos editando ----
  useEffect(() => {
    if (!modoEdicion) return;

    obtenerEquipo(id).then((respuesta) => {
      setCargandoDatos(false);

      if (!respuesta.ok) {
        setError(respuesta.message || 'No se pudo cargar el equipo');
        return;
      }

      const equipo = respuesta.data;
      setForm({ codigo: equipo.codigo, descripcion: equipo.descripcion, estado: equipo.estado });
      setImagenActual(equipo.imagen);
    });
  }, [id, modoEdicion]);

  // ---- Libera la URL de previsualizacion generada con createObjectURL ----
  useEffect(() => {
    return () => {
      if (previsualizacion) URL.revokeObjectURL(previsualizacion);
    };
  }, [previsualizacion]);

  const manejarCambioTexto = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Valida el tipo y tamano de un archivo de imagen antes de aceptarlo,
   * y arma su previsualizacion. Se usa tanto para el input de archivo
   * como para el Drag & Drop, asi la validacion queda en un solo lugar.
   * @param {File|undefined} archivo - Archivo seleccionado o soltado.
   */
  const procesarArchivoSeleccionado = (archivo) => {
    if (!archivo) return;

    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
      setError('Formato de imagen no permitido. Use JPG, PNG o WEBP.');
      return;
    }
    if (archivo.size > TAMANO_MAX_MB * 1024 * 1024) {
      setError(`La imagen no debe superar ${TAMANO_MAX_MB}MB.`);
      return;
    }

    setError('');
    setArchivoNuevo(archivo);
    setPrevisualizacion(URL.createObjectURL(archivo));
  };

  const manejarCambioArchivo = (e) => {
    procesarArchivoSeleccionado(e.target.files?.[0]);
  };

  const manejarDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    procesarArchivoSeleccionado(e.dataTransfer.files?.[0]);
  };

  const quitarImagenSeleccionada = () => {
    setArchivoNuevo(null);
    setPrevisualizacion(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = '';
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);

    const datos = { ...form, imagen: archivoNuevo };
    const respuesta = modoEdicion ? await actualizarEquipo(id, datos) : await crearEquipo(datos);

    setGuardando(false);

    if (!respuesta.ok) {
      setError(respuesta.message || 'No se pudo guardar el equipo');
      return;
    }

    navigate('/equipos');
  };

  // ---- Guard de rol ----
  if (!usuario) return null; // RutaProtegida maneja el estado de carga

  if (usuario.rol !== 'administrador') {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
        <Alert color="rojo" titulo="Acceso denegado." texto="No tiene permisos para ver esta seccion." />
      </div>
    );
  }

  const estaPrestado = modoEdicion && form.estado === 'PRESTADO';
  const imagenParaMostrar = previsualizacion || urlImagenEquipo(imagenActual);

  return (
    <>
      <Navbar
        color="azul"
        texto="SIGMA"
        navList={true}
        links={obtenerLinksNav(usuario, '/equipos')}
        buttonContent={<Button color="rojo" tamano="pequeño" onClick={logout} texto="Cerrar sesion" />}
      />

      <div className="container" style={{ maxWidth: '640px' }}>
        <Titulo
          tipografia="h2"
          texto={modoEdicion ? 'Editar Equipo' : 'Registrar Equipo'}
          color_text="negro"
          alineado="centro"
        />

        {cargandoDatos ? (
          <div className="text-center py-4">
            <Spinner color="primary" />
          </div>
        ) : (
          <Card
            responsivo={true}
            card_width="100%"
            color_texto="negro"
            texto_alineado="left"
            chil_body={
              <form onSubmit={manejarSubmit}>
                {estaPrestado && (
                  <Alert
                    color="celeste"
                    fondoBlanco={true}
                    texto="Este equipo esta actualmente PRESTADO. El estado solo puede cambiarse desde el modulo de Prestamos al registrar la devolucion."
                  />
                )}

                <div className="mb-3">
                  <Input
                    label="Codigo"
                    name="codigo"
                    placeholder="Ej: PROJ-001"
                    value={form.codigo}
                    onChange={manejarCambioTexto}
                  />
                  <small className="text-muted">Solo letras, numeros, guiones (2 a 50 caracteres).</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Descripcion</label>
                  <textarea
                    name="descripcion"
                    className="form-control"
                    rows={3}
                    maxLength={255}
                    value={form.descripcion}
                    onChange={manejarCambioTexto}
                  />
                </div>

                <div className="mb-3">
                  {estaPrestado ? (
                    <>
                      <label className="form-label">Estado</label>
                      <input type="text" className="form-control" value="PRESTADO" disabled />
                    </>
                  ) : (
                    <Select
                      label="Estado"
                      options={ESTADOS_MANUALES.map((e) => ({ value: e, text: e }))}
                      value={form.estado}
                      texto="Seleccione un estado"
                      placeholderSeleccionable={false}
                      onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    />
                  )}
                </div>

                {/* ======== Imagen: Drag & Drop + input de archivo ======== */}
                <div className="mb-3">
                  <label className="form-label">Imagen del equipo</label>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setArrastrando(true);
                    }}
                    onDragLeave={() => setArrastrando(false)}
                    onDrop={manejarDrop}
                    onClick={() => inputArchivoRef.current?.click()}
                    className={`border rounded d-flex flex-column align-items-center justify-content-center p-3 ${
                      arrastrando ? 'border-primary bg-light' : 'border-secondary-subtle'
                    }`}
                    style={{ cursor: 'pointer', minHeight: 160, borderStyle: 'dashed' }}
                  >
                    {imagenParaMostrar ? (
                      <img
                        src={imagenParaMostrar}
                        alt="Vista previa"
                        className="rounded mb-2"
                        style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <i className="bi bi-cloud-arrow-up fs-1 text-muted mb-2" />
                    )}
                    <span className="text-muted small text-center">
                      Arrastre una imagen aqui o haga clic para seleccionarla (JPG, PNG o WEBP, max {TAMANO_MAX_MB}MB)
                    </span>

                    <input
                      ref={inputArchivoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="d-none"
                      onChange={manejarCambioArchivo}
                    />
                  </div>

                  {archivoNuevo && (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <span className="text-muted small">{archivoNuevo.name}</span>
                      <Button
                        type="button"
                        color="gris"
                        tamano="pequeño"
                        texto="Quitar"
                        onClick={(e) => {
                          e.stopPropagation();
                          quitarImagenSeleccionada();
                        }}
                      />
                    </div>
                  )}
                </div>

                {error && <Alert color="rojo" fondoBlanco={true} texto={error} />}

                <div className="d-flex gap-2 mt-4">
                  <Button type="submit" color="azul" cargando={guardando} texto="Guardar" />
                  <Button type="button" color="gris" texto="Cancelar" onClick={() => navigate('/equipos')} />
                </div>
              </form>
            }
          />
        )}
      </div>
    </>
  );
}
