import React from 'react';

type VarianteInsignia = 'exito' | 'advertencia' | 'error' | 'info' | 'neutral' | 'primario';

interface PropiedadesInsignia {
  variante?: VarianteInsignia;
  children: React.ReactNode;
  icono?: React.ReactNode;
  estilo?: React.CSSProperties;
}

const ESTILOS: Record<VarianteInsignia, React.CSSProperties> = {
  exito:      { backgroundColor: 'var(--color-exito-suave)',      color: 'var(--color-exito)' },
  advertencia:{ backgroundColor: 'var(--color-advertencia-suave)',color: 'var(--color-advertencia)' },
  error:      { backgroundColor: 'var(--color-error-suave)',      color: 'var(--color-error)' },
  info:       { backgroundColor: 'var(--color-info-suave)',       color: 'var(--color-info)' },
  neutral:    { backgroundColor: 'var(--color-neutral-suave)',    color: 'var(--color-texto-suave)' },
  primario:   { backgroundColor: 'rgba(52,82,204,0.1)',           color: 'var(--color-primario)' },
};

export function Insignia({ variante = 'neutral', children, icono, estilo }: PropiedadesInsignia) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '99px',
        fontSize: 'var(--tamano-xs)',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        ...ESTILOS[variante],
        ...estilo,
      }}
    >
      {icono && <span style={{ display: 'flex', alignItems: 'center' }}>{icono}</span>}
      {children}
    </span>
  );
}

/* Mapa de variante por valor de estado de dominio */
export function insigniaPorEstado(estado: string): VarianteInsignia {
  const mapa: Record<string, VarianteInsignia> = {
    ACTIVO:     'exito',
    ABIERTO:    'exito',
    CONFIRMADA: 'exito',
    COMPLETADA: 'primario',
    PENDIENTE:  'advertencia',
    EN_CURSO:   'info',
    INACTIVO:   'neutral',
    CERRADO:    'neutral',
    CANCELADA:  'error',
    ELIMINADO:  'error',
    BLOQUEADA:  'error',
  };
  return mapa[estado.toUpperCase()] ?? 'neutral';
}
