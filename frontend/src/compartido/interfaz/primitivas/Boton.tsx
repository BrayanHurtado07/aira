import React from 'react';
import { Loader2 } from 'lucide-react';

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma';
type TamanoBoton = 'sm' | 'md' | 'lg';

type PropiedadesBoton = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
  icono?: React.ReactNode;
};

const estilosBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
  fontWeight: 500,
  borderRadius: 'var(--radio-md)',
  border: '1px solid transparent',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.01em',
  lineHeight: 1,
};

const estilosPorVariante: Record<VarianteBoton, React.CSSProperties> = {
  primario: {
    backgroundColor: 'var(--color-primario)',
    color: '#fff',
    borderColor: 'var(--color-primario)',
    boxShadow: 'var(--sombra-xs)',
  },
  secundario: {
    backgroundColor: 'var(--color-superficie)',
    color: 'var(--color-texto)',
    borderColor: 'var(--color-borde)',
    boxShadow: 'var(--sombra-xs)',
  },
  peligro: {
    backgroundColor: 'var(--color-error)',
    color: '#fff',
    borderColor: 'var(--color-error)',
    boxShadow: 'var(--sombra-xs)',
  },
  fantasma: {
    backgroundColor: 'transparent',
    color: 'var(--color-texto-suave)',
    borderColor: 'transparent',
  },
};

const estilosPorTamano: Record<TamanoBoton, React.CSSProperties> = {
  sm: { padding: '0.375rem 0.75rem', fontSize: 'var(--tamano-sm)', gap: '0.25rem' },
  md: { padding: '0.5rem 1rem',      fontSize: 'var(--tamano-sm)' },
  lg: { padding: '0.625rem 1.25rem', fontSize: 'var(--tamano-base)' },
};

export function Boton({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  disabled,
  children,
  icono,
  style,
  className,
  ...props
}: PropiedadesBoton) {
  const estaDeshabilitado = disabled || cargando;

  return (
    <button
      {...props}
      disabled={estaDeshabilitado}
      className={`btn-aira${className ? ` ${className}` : ''}`}
      style={{
        ...estilosBase,
        ...estilosPorVariante[variante],
        ...estilosPorTamano[tamano],
        opacity: estaDeshabilitado ? 0.55 : 1,
        cursor: estaDeshabilitado ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {cargando ? (
        <Loader2
          size={tamano === 'lg' ? 16 : 14}
          style={{ animation: 'girar 0.7s linear infinite', flexShrink: 0 }}
        />
      ) : icono ? (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icono}</span>
      ) : null}
      {children}
    </button>
  );
}
