import React from 'react';

type PropsCeldaEntidad = {
  /** Ícono (lucide) que representa la entidad. */
  icono?: React.ReactNode;
  nombre: string;
  /** Línea secundaria opcional (ej. categoría, código). */
  secundario?: string | null;
};

// Celda de entidad (icono + nombre + dato secundario). Para filas de tabla que
// NO son clientes (servicios, productos, planes…). Reusa el layout de CeldaCliente.
export function CeldaEntidad({ icono, nombre, secundario }: PropsCeldaEntidad) {
  return (
    <div className="celda-cliente">
      {icono && <div className="celda-entidad-icono" aria-hidden="true">{icono}</div>}
      <div className="celda-cliente-info">
        <span className="celda-cliente-nombre">{nombre}</span>
        {secundario && <span className="celda-cliente-sub">{secundario}</span>}
      </div>
    </div>
  );
}
