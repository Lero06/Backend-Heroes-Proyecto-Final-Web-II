/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: Tabla.jsx
Autor: Leandro Sanchez Rojas / Marco Vásquez
Fecha: 12/08/2026
Modulo: Frontend - Componentes Reutilizables
Descripcion:
Componente de tabla Bootstrap reutilizable. Admite arreglo de columnas
en texto o con especificacion de ancho fijo ({ texto, ancho }) para evitar
desplazamientos de celdas al interactuar con las filas.
//////////////////////////////////////////////////////////
*/

export default function Tabla({
  columnas = [],
  children
}) {
  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover table-bordered table-sm align-middle mb-0 text-dark">
        <thead className="table-dark text-white text-center">
          <tr>
            {columnas.map((col, index) => {
              const esObjeto = typeof col === 'object' && col !== null;
              const titulo = esObjeto ? col.texto : col;
              const ancho = esObjeto ? col.ancho : undefined;

              return (
                <th
                  key={index}
                  className="text-center align-middle"
                  style={ancho ? { width: ancho } : undefined}
                >
                  {titulo}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="text-dark" style={{ color: '#000000' }}>
          {children}
        </tbody>
      </table>
    </div>
  );
}
