/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: main.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Arquitectura Base
Descripcion:
Punto de entrada de la aplicacion React. Carga el tema de Bootswatch
(reemplaza el CSS de Bootstrap, asi que no se importa el bootstrap.css
original), Bootstrap Icons, y envuelve la app con el router y el
contexto de autenticacion.

Para cambiar de tema: reemplazar "flatly" por cualquier otro nombre
de la carpeta node_modules/bootswatch/dist/ (ej. "darkly", "cosmo",
"minty", "sandstone"...).
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import 'bootswatch/dist/flatly/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

/*
//////////////////////////////////////////////////////////
RENDER
//////////////////////////////////////////////////////////
*/

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
