type PropiedadesPantallaCarga = {
  mensaje?: string;
};

export function PantallaCarga({ mensaje = 'Cargando…' }: PropiedadesPantallaCarga) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        color: 'var(--color-texto-suave)',
      }}
    >
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          border: '3px solid var(--color-borde)',
          borderTopColor: 'var(--color-acento)',
          borderRadius: '50%',
          animation: 'girar 0.7s linear infinite',
        }}
      />
      <p style={{ fontSize: 'var(--tamano-sm)' }}>{mensaje}</p>
      <style>{`@keyframes girar { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
