/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Perfil.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Usuarios
Descripcion:
Pantalla de perfil del usuario autenticado. Permite ver/editar nombre,
fecha de nacimiento y departamento (correo y usuario se muestran pero
no son editables), y cambiar la contraseña. Requiere sesion activa,
la ruta esta protegida por RutaProtegida (ver App.jsx).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function Perfil() {
  const { usuario, verificarSesion, logout } = useAuth();

  const [form, setForm] = useState({ nombre_completo: '', fecha_nacimiento: '', departamento_id: '' });
  const [departamentos, setDepartamentos] = useState([]);
  const [mensajePerfil, setMensajePerfil] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    password_nueva: '',
    confirmar_password_nueva: '',
  });
  const [mensajePassword, setMensajePassword] = useState('');

  // Precarga el formulario con los datos actuales del perfil
  useEffect(() => {
    if (usuario) {
      setForm({
        nombre_completo: usuario.nombre_completo,
        fecha_nacimiento: usuario.fecha_nacimiento?.slice(0, 10) || '',
        departamento_id: usuario.departamento_id || '',
      });
    }
    apiFetch('/departamentos').then((respuesta) => {
      if (respuesta.ok) setDepartamentos(respuesta.data);
    });
  }, [usuario]);

  const manejarCambioPerfil = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    const respuesta = await apiFetch('/usuarios/perfil', {
      method: 'PUT',
      body: { ...form, departamento_id: Number(form.departamento_id) },
    });
    setMensajePerfil(respuesta.message);
    if (respuesta.ok) verificarSesion(); // refresca el contexto con los datos nuevos
  };

  const manejarCambioPassword = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    const respuesta = await apiFetch('/usuarios/cambiar-password', {
      method: 'PUT',
      body: passwordForm,
    });
    setMensajePassword(respuesta.message);
    if (respuesta.ok) {
      setPasswordForm({ password_actual: '', password_nueva: '', confirmar_password_nueva: '' });
    }
  };

  if (!usuario) return null; // RutaProtegida ya maneja el estado de carga

  return (
    <div className="container" style={{ maxWidth: '520px', marginTop: '3rem' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Mi perfil</h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
          Cerrar sesion
        </button>
      </div>

      <p className="text-muted">
        Usuario: <strong>{usuario.usuario}</strong> &middot; Correo: <strong>{usuario.correo}</strong> &middot;
        Rol: <strong>{usuario.rol}</strong>
      </p>

      <form onSubmit={guardarPerfil} className="mb-5">
        <h2 className="h5">Datos personales</h2>

        <div className="mb-3">
          <label className="form-label">Nombre completo</label>
          <input
            type="text"
            name="nombre_completo"
            className="form-control"
            value={form.nombre_completo}
            onChange={manejarCambioPerfil}
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
            onChange={manejarCambioPerfil}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Departamento / carrera</label>
          <select
            name="departamento_id"
            className="form-select"
            value={form.departamento_id}
            onChange={manejarCambioPerfil}
            required
          >
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        {mensajePerfil && <div className="alert alert-info py-2">{mensajePerfil}</div>}

        <button type="submit" className="btn btn-primary">
          Guardar cambios
        </button>
      </form>

      <form onSubmit={cambiarPassword}>
        <h2 className="h5">Cambiar contraseña</h2>

        <div className="mb-3">
          <label className="form-label">Contraseña actual</label>
          <input
            type="password"
            name="password_actual"
            className="form-control"
            value={passwordForm.password_actual}
            onChange={manejarCambioPassword}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Nueva contraseña</label>
          <input
            type="password"
            name="password_nueva"
            className="form-control"
            value={passwordForm.password_nueva}
            onChange={manejarCambioPassword}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirmar nueva contraseña</label>
          <input
            type="password"
            name="confirmar_password_nueva"
            className="form-control"
            value={passwordForm.confirmar_password_nueva}
            onChange={manejarCambioPassword}
            required
          />
        </div>

        {mensajePassword && <div className="alert alert-info py-2">{mensajePassword}</div>}

        <button type="submit" className="btn btn-primary">
          Cambiar contraseña
        </button>
      </form>
    </div>
  );
}
