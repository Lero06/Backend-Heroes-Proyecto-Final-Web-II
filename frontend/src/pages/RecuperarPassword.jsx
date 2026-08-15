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
Como todavia no hay envio de correo real configurado, el backend
devuelve el enlace en la respuesta y esta pantalla lo muestra
directamente para poder probar el flujo completo.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function RecuperarPassword() {
  const [identificador, setIdentificador] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enlace, setEnlace] = useState('');
  const [enviando, setEnviando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setEnlace('');

    const respuesta = await apiFetch('/auth/recuperar-password', {
      method: 'POST',
      body: { identificador },
    });

    setEnviando(false);
    setMensaje(respuesta.message);

    // El backend todavia no envia correo real: mientras tanto, devuelve
    // el enlace en la respuesta para poder probar el flujo completo.
    if (respuesta.ok && respuesta.data?.enlace) {
      setEnlace(respuesta.data.enlace);
    }
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

        {enlace && (
          <div className="alert alert-warning py-2">
            <strong>Modo de prueba</strong> (todavia no hay envio de correo real):
            <br />
            <Link to={enlace.replace('http://localhost:5173', '')}>{enlace}</Link>
          </div>
        )}

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
