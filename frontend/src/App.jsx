/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: App.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Arquitectura Base
Descripcion:
Define las rutas de la aplicacion. Cada integrante agrega aqui las
paginas de su modulo (marcas, equipos, prestamos, reportes) cuando
las tenga listas.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';

import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import Perfil from './pages/Perfil';

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function App() {
  const { verificarSesion } = useAuth();

  // Verifica si ya hay una sesion activa (cookie valida) al cargar la app
  useEffect(() => {
    verificarSesion();
  }, [verificarSesion]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/perfil" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      <Route path="/restablecer-password" element={<RestablecerPassword />} />
      <Route
        path="/perfil"
        element={
          <RutaProtegida>
            <Perfil />
          </RutaProtegida>
        }
      />

      {/* Cada integrante agrega aqui las rutas de su modulo */}
      {/* <Route path="/marcas" element={<RutaProtegida><Marcas /></RutaProtegida>} /> */}
      {/* <Route path="/equipos" element={<RutaProtegida><Equipos /></RutaProtegida>} /> */}
      {/* <Route path="/prestamos" element={<RutaProtegida><Prestamos /></RutaProtegida>} /> */}
    </Routes>
  );
}
