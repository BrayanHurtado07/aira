import React from 'react';
import { PantallaCarga } from '@/compartido/interfaz/retroalimentacion/PantallaCarga';
import { usarCapacidadActiva } from './usarCapacidadActiva';

type PropiedadesGuardiaCapacidad = {
  codigo: string;
  children: React.ReactNode;
};

function CapacidadNoDisponible({ codigo }: { codigo: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--espacio-2xl)',
        gap: 'var(--espacio-md)',
        color: 'var(--color-texto-suave)',
        textAlign: 'center',
      }}
    >
      <p>La capacidad <strong>{codigo}</strong> no está disponible en tu plan actual.</p>
    </div>
  );
}

export function GuardiaCapacidad({ codigo, children }: PropiedadesGuardiaCapacidad) {
  const estado = usarCapacidadActiva(codigo);

  if (estado === 'cargando') return <PantallaCarga mensaje="Validando capacidad" />;
  if (estado === 'bloqueada') return <CapacidadNoDisponible codigo={codigo} />;

  return <>{children}</>;
}
