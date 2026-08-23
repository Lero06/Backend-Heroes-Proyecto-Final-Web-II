/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Inicio.jsx
Autor: Jose Rodolfo Chaves Herrera
Fecha: 23/08/2026
Modulo: Frontend - Inicio
Descripcion:
Pagina de inicio que se muestra justo despues de iniciar sesion.
Consolida el acceso a todos los modulos del sistema en un solo lugar
(en vez de aterrizar directo en Reportes, como pasaba antes), usando
la misma lista de modulos que el Navbar (ver utils/navLinks.js) para
que nunca queden desincronizados.
//////////////////////////////////////////////////////////
*/

/*
//////////////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////////////
*/

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerLinksNav } from '../utils/navLinks';
import Navbar from '../components/Navbar';
import Titulo from '../components/Titulo';
import Card from '../components/Card';
import Button from '../components/Buttons';

/*
//////////////////////////////////////////////////////////
CONFIGURACION DE TARJETAS
//////////////////////////////////////////////////////////
*/

// Descripcion corta por modulo, solo para esta pantalla (el Navbar no la necesita).
const DESCRIPCION_POR_URL = {
  '/equipos': 'Consulta el inventario, registra equipos nuevos y da seguimiento a su estado.',
  '/reportes': 'Filtra las marcas registradas y exporta reportes en JSON, XML o PDF.',
  '/perfil': 'Revisa y actualiza tus datos personales, o cambia tu contraseña.',
};

/*
//////////////////////////////////////////////////////////
COMPONENTE PRINCIPAL
//////////////////////////////////////////////////////////
*/

export default function Inicio() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null; // RutaProtegida maneja el estado de carga

  // Todos los modulos disponibles para este usuario, menos "Inicio" (ya estamos aqui)
  const modulos = obtenerLinksNav(usuario).filter((link) => link.url !== '/');

  return (
    <>
      <Navbar
        color="azul"
        texto="SIGMA"
        navList={true}
        links={obtenerLinksNav(usuario, '/')}
        buttonContent={<Button color="rojo" tamano="pequeño" onClick={logout} texto="Cerrar sesion" />}
      />

      <div className="container-fluid px-4">
        <Titulo
          tipografia="h2"
          texto={`Bienvenido, ${usuario.nombre_completo || usuario.usuario}`}
          color_text="negro"
          alineado="centro"
        />
        <p className="text-center text-muted mb-4">Elige un modulo para continuar.</p>

        <div className="row g-4">
          {modulos.map((modulo) => (
            <div key={modulo.url} className="col-12 col-md-6 col-lg-4">
              <Card
                responsivo={true}
                card_width="100%"
                color_texto="negro"
                texto_alineado="left"
                titulo={modulo.texto}
                chil_body={
                  <>
                    <p className="text-muted">
                      {DESCRIPCION_POR_URL[modulo.url] || 'Modulo del sistema.'}
                    </p>
                    <Button
                      color="azul"
                      texto={`Ir a ${modulo.texto}`}
                      onClick={() => navigate(modulo.url)}
                    />
                  </>
                }
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
