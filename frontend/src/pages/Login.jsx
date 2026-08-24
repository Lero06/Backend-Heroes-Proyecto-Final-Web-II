/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Login.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Autenticacion
Descripcion:
Pantalla de inicio de sesion. Acepta usuario o correo como
identificador, llama a POST /api/auth/login mediante el AuthContext y
redirige al perfil si el login es exitoso.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identificador: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  /**
   * Actualiza un campo del formulario en base a su name.
   */
  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Envia las credenciales al backend y redirige si son validas.
   */
  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);

    const respuesta = await login(form);

    setEnviando(false);

    if (!respuesta.ok) {
      setError(respuesta.message);
      return;
    }

    navigate('/');
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: '#f0f2f5' }}
    >
      <div
        className="card shadow-sm border-0 rounded-3 p-4 p-sm-5"
        style={{ maxWidth: '440px', width: '90%', backgroundColor: '#ffffff' }}
      >
        {/* Logo SIGMA */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 mb-3 px-4 py-2 shadow-sm"
          >
            <span className="fw-bold text-white" style={{ fontSize: '32px', letterSpacing: '3px' }}>
              SIGMA
            </span>
          </div>
          <h2 className="h6 fw-bold mb-1 text-secondary">Sistema de Gestión de Marcas y Equipos</h2>
        </div>

        <form onSubmit={manejarSubmit}>
          <div className="mb-3">
            <input
              type="text"
              name="identificador"
              className="form-control form-control-lg fs-6"
              placeholder="Usuario o Correo"
              value={form.identificador}
              onChange={manejarCambio}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              name="password"
              className="form-control form-control-lg fs-6"
              placeholder="Contraseña"
              value={form.password}
              onChange={manejarCambio}
              required
            />
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg w-100 fs-6 fw-semibold py-2" disabled={enviando}>
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="d-flex justify-content-between mt-4 small">
          <Link to="/registro" className="text-decoration-none">Crear cuenta</Link>
          <Link to="/recuperar-password" className="text-decoration-none">Olvidé mi contraseña</Link>
        </div>
      </div>
    </div>
  );
}
