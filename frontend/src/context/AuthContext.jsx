/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: AuthContext.jsx
Autor: Leandro Sanchez Rojas
Fecha: 12/08/2026
Modulo: Frontend - Autenticacion
Descripcion:
Contexto de React que guarda el usuario autenticado en memoria y
expone funciones para iniciar/cerrar sesion. No usa localStorage: la
sesion real vive en la cookie HttpOnly del backend, esto solo evita
tener que volver a pedir el perfil en cada componente.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { createContext, useContext, useState, useCallback } from 'react';
import { apiFetch } from '../api/client';

/*
//////////////////////////////////////////////////////////
CONTEXTO
//////////////////////////////////////////////////////////
*/

const AuthContext = createContext(null);

/**
 * Proveedor del contexto de autenticacion. Debe envolver toda la app
 * (ver main.jsx) para que cualquier pagina pueda usar useAuth().
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState('');

  /**
   * Consulta el perfil actual para saber si hay una sesion valida.
   * Se llama una vez al cargar la app. Si el fetch falla por completo
   * (backend caido, CORS, red), no deja "cargando" trabado: informa
   * el error y continua sin sesion.
   */
  const verificarSesion = useCallback(async () => {
    setErrorConexion('');
    try {
      const respuesta = await apiFetch('/usuarios/perfil');
      setUsuario(respuesta.ok ? respuesta.data : null);
    } catch (err) {
      setUsuario(null);
      setErrorConexion('No se pudo conectar con el servidor. Verifica que el backend este corriendo.');
    } finally {
      setCargando(false);
    }
  }, []);

  /**
   * Inicia sesion contra el backend. El endpoint de login solo
   * devuelve datos minimos (id, usuario, correo, rol), asi que
   * ademas se pide el perfil completo para tener nombre_completo,
   * fecha_nacimiento y departamento_id disponibles de inmediato
   * (por ejemplo, para precargar el formulario de Perfil).
   * @param {{identificador: string, password: string}} credenciales
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  const login = useCallback(async (credenciales) => {
    const respuesta = await apiFetch('/auth/login', { method: 'POST', body: credenciales });

    if (respuesta.ok) {
      const perfil = await apiFetch('/usuarios/perfil');
      setUsuario(perfil.ok ? perfil.data : respuesta.data);
    }

    return respuesta;
  }, []);

  /**
   * Cierra la sesion actual (backend + contexto local).
   */
  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUsuario(null);
  }, []);

  const value = { usuario, cargando, errorConexion, verificarSesion, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticacion desde cualquier componente.
 * @returns {{usuario: object|null, cargando: boolean, verificarSesion: Function, login: Function, logout: Function}}
 */
export function useAuth() {
  return useContext(AuthContext);
}
