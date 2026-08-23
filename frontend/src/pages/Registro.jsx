/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Registro.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Autenticacion
Descripcion:
Pantalla de registro de un nuevo usuario. Carga el selector de
departamentos desde GET /api/departamentos (endpoint publico) y envia
el formulario a POST /api/auth/registro.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useEffect, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

/*
//////////////////////////////////////////////////////////
CONSTANTES
//////////////////////////////////////////////////////////
*/

const FORM_INICIAL = {
  nombre_completo: '',
  fecha_nacimiento: '',
  correo: '',
  departamento_id: '',
  usuario: '',
  password: '',
  confirmar_password: '',
};

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function Registro() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(FORM_INICIAL);
  const [departamentos, setDepartamentos] = useState([]);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  // Carga el selector de departamentos al montar la pagina
  useEffect(() => {
    apiFetch('/departamentos').then((respuesta) => {
      if (respuesta.ok) setDepartamentos(respuesta.data);
    });
  }, []);

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setEnviando(true);

    const respuesta = await apiFetch('/auth/registro', {
      method: 'POST',
      body: { ...form, departamento_id: Number(form.departamento_id) },
    });

    setEnviando(false);

    if (!respuesta.ok) {
      setError(respuesta.message);
      return;
    }

    setExito('Cuenta creada correctamente. Ya podes iniciar sesion.');
    setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <div className="container" style={{ maxWidth: '480px', marginTop: '3rem' }}>
      <h1 className="h3 mb-4 text-center">Crear cuenta</h1>

      <form onSubmit={manejarSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre completo</label>
          <input
            type="text"
            name="nombre_completo"
            className="form-control"
            value={form.nombre_completo}
            onChange={manejarCambio}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Fecha de nacimiento</label>
          <input
            type="date"
            name="fecha_nacimiento"
            className="form-control"
            value={form.fecha_nacimiento}
            onChange={manejarCambio}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Correo electronico</label>
          <input
            type="email"
            name="correo"
            className="form-control"
            value={form.correo}
            onChange={manejarCambio}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Departamento / carrera</label>
          <select
            name="departamento_id"
            className="form-select"
            value={form.departamento_id}
            onChange={manejarCambio}
            required
          >
            <option value="" disabled>
              Seleccione una opcion
            </option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Nombre de usuario</label>
          <input
            type="text"
            name="usuario"
            className="form-control"
            value={form.usuario}
            onChange={manejarCambio}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contrasena</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={manejarCambio}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirmar contrasena</label>
          <input
            type="password"
            name="confirmar_password"
            className="form-control"
            value={form.confirmar_password}
            onChange={manejarCambio}
            required
          />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {exito && <div className="alert alert-success py-2">{exito}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <div className="text-center mt-3">
        <Link to="/login">Ya tengo cuenta</Link>
      </div>
    </div>
  );
}
