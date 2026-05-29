interface PropiedadesCargando {
  mensaje?: string;
  tamano?: 'sm' | 'md' | 'lg';
}

const TAMANOS = {
  sm: { spinner: '1rem',   borde: '2px',  padding: 'var(--espacio-md)' },
  md: { spinner: '1.5rem', borde: '2px',  padding: 'var(--espacio-xl)' },
  lg: { spinner: '2rem',   borde: '3px',  padding: 'var(--espacio-2xl)' },
};

export function Cargando({ mensaje, tamano = 'md' }: PropiedadesCargando) {
  const t = TAMANOS[tamano];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--espacio-sm)',
        padding: t.padding,
      }}
    >
      <div
        style={{
          width: t.spinner,
          height: t.spinner,
          border: `${t.borde} solid var(--color-borde)`,
          borderTopColor: 'var(--color-primario)',
          borderRadius: '50%',
          animation: 'girar 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
      {mensaje && (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
