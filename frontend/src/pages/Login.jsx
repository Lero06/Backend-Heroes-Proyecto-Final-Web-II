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
    <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <h1 className="h3 mb-4 text-center">Iniciar sesion</h1>

      <form onSubmit={manejarSubmit}>
        <div className="mb-3">
          <label className="form-label">Usuario o correo</label>
          <input
            type="text"
            name="identificador"
            className="form-control"
            value={form.identificador}
            onChange={manejarCambio}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={manejarCambio}
            required
          />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="d-flex justify-content-between mt-3">
        <Link to="/registro">Crear cuenta</Link>
        <Link to="/recuperar-password">Olvide mi contraseña</Link>
      </div>
      </div>
    </div>
  );
}
