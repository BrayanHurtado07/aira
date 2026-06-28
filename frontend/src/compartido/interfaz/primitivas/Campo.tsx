import React from 'react';

type PropiedadesCampo = React.InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  children?: React.ReactNode;
};

export function Campo({ etiqueta, error, ayuda, requerido, id, children, style, className, ...props }: PropiedadesCampo) {
  const idCampo = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...(style as React.CSSProperties) }}>
      <label
        htmlFor={idCampo}
        style={{
          fontSize: 'var(--tamano-sm)',
          fontWeight: 500,
          color: 'var(--color-texto)',
          lineHeight: 1.4,
        }}
      >
        {etiqueta}
        {requerido && (
          <span style={{ color: 'var(--color-error)', marginLeft: '0.2rem' }}>*</span>
        )}
      </label>

      {children ?? (
        <input
          {...props}
          id={idCampo}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
          className={['campo-input', error ? 'campo-input--error' : '', className].filter(Boolean).join(' ')}
        />
      )}

      {error && (
        <span id={`${idCampo}-error`} className="campo-error-inline" role="alert">
          {error}
        </span>
      )}
      {ayuda && !error && (
        <span id={`${idCampo}-ayuda`} style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
          {ayuda}
        </span>
      )}
    </div>
  );
}
