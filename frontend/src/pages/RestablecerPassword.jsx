/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: RestablecerPassword.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Autenticacion
Descripcion:
Pantalla a la que llega el usuario desde el enlace de recuperacion
(?token=xxxx). Lee el token de la URL y envia la nueva contrasena a
POST /api/auth/restablecer-password.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPasswordNueva, setConfirmarPasswordNueva] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setEnviando(true);

    const respuesta = await apiFetch('/auth/restablecer-password', {
      method: 'POST',
      body: { token, password_nueva: passwordNueva, confirmar_password_nueva: confirmarPasswordNueva },
    });

    setEnviando(false);

    if (!respuesta.ok) {
      setError(respuesta.message);
      return;
    }

    setExito('Contrasena restablecida. Ya podes iniciar sesion.');
    setTimeout(() => navigate('/login'), 1500);
  };

  if (!token) {
    return (
      <div className="container text-center" style={{ marginTop: '4rem' }}>
        <div className="alert alert-warning">Enlace invalido: falta el token de recuperacion.</div>
        <Link to="/recuperar-password">Solicitar un nuevo enlace</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '4rem' }}>
      <h1 className="h3 mb-4 text-center">Restablecer contrasena</h1>

      <form onSubmit={manejarSubmit}>
        <div className="mb-3">
          <label className="form-label">Nueva contrasena</label>
          <input
            type="password"
            className="form-control"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirmar nueva contrasena</label>
          <input
            type="password"
            className="form-control"
            value={confirmarPasswordNueva}
            onChange={(e) => setConfirmarPasswordNueva(e.target.value)}
            required
          />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {exito && <div className="alert alert-success py-2">{exito}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Restablecer contrasena'}
        </button>
      </form>
    </div>
  );
}
