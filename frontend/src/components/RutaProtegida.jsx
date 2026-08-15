/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: RutaProtegida.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Autenticacion
Descripcion:
Envoltorio de rutas que exige sesion activa. Mientras se verifica la
sesion muestra un mensaje de carga; si no hay usuario autenticado,
redirige a /login.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

/**
 * Bloquea el acceso a sus hijos si no hay una sesion activa.
 * @param {{children: React.ReactNode}} props
 */
export default function RutaProtegida({ children }) {
  const { usuario, cargando, errorConexion } = useAuth();

  if (cargando) {
    return (
      <div className="container text-center" style={{ marginTop: '4rem' }}>
        Cargando...
      </div>
    );
  }

  if (errorConexion) {
    return (
      <div className="container text-center" style={{ marginTop: '4rem' }}>
        <div className="alert alert-danger">{errorConexion}</div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
