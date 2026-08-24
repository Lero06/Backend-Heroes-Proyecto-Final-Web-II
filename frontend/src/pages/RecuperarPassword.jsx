/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: RecuperarPassword.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Autenticacion
Descripcion:
Pantalla para solicitar la recuperacion de contrasena. Envia el
usuario/correo a POST /api/auth/recuperar-password. El backend
siempre responde el mismo mensaje generico, exista o no el usuario.
Solicita la recuperacion de contrasena al backend. El backend envia
un correo real con el enlace de restablecimiento mediante Mailtrap.
Esta pantalla solo muestra el mensaje generico de confirmacion.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function RecuperarPassword() {
  const { usuario } = useAuth();
  const [identificador, setIdentificador] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    const respuesta = await apiFetch('/auth/recuperar-password', {
      method: 'POST',
      body: { identificador },
    });

    setEnviando(false);
    setMensaje(respuesta.message);
  };

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '4rem' }}>
      <h1 className="h3 mb-4 text-center">Recuperar contrasena</h1>

      <form onSubmit={manejarSubmit}>
        <div className="mb-3">
          <label className="form-label">Usuario o correo</label>
          <input
            type="text"
            className="form-control"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            required
          />
        </div>

        {mensaje && <div className="alert alert-info py-2">{mensaje}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar enlace de recuperacion'}
        </button>
      </form>

      <div className="text-center mt-3">
        <Link to="/login">Volver a iniciar sesion</Link>
      </div>
    </div>
  );
}
