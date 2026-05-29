import React from 'react';
import { Inbox } from 'lucide-react';

interface PropiedadesVacio {
  titulo?: string;
  mensaje?: string;
  icono?: React.ReactNode;
  accion?: React.ReactNode;
}

export function Vacio({
  titulo = 'Sin resultados',
  mensaje = 'No hay elementos para mostrar.',
  icono,
  accion,
}: PropiedadesVacio) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--espacio-2xl)',
        gap: 'var(--espacio-md)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: 'var(--radio-xl)',
          backgroundColor: 'var(--color-superficie-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-texto-muted)',
        }}
      >
        {icono ?? <Inbox size={24} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <p style={{ fontSize: 'var(--tamano-sm)', fontWeight: 600, color: 'var(--color-texto)' }}>
          {titulo}
        </p>
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', maxWidth: '24rem' }}>
          {mensaje}
        </p>
      </div>

      {accion && <div>{accion}</div>}
    </div>
  );
}
