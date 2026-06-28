import { Link } from 'react-router-dom';

export function Pagina404() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--espacio-md)',
        padding: 'var(--espacio-xl)',
        textAlign: 'center',
        backgroundColor: 'var(--color-fondo)',
        color: 'var(--color-texto)',
      }}
    >
      <p style={{ fontSize: 'var(--tamano-4xl)', fontWeight: 900, fontFamily: 'var(--fuente-display)', margin: 0 }}>
        404
      </p>
      <p style={{ fontSize: 'var(--tamano-lg)', fontWeight: 600, margin: 0 }}>
        No encontramos esta página
      </p>
      <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', margin: 0, maxWidth: '28rem' }}>
        El enlace puede estar roto o la página fue movida.
      </p>
      <Link
        to="/"
        style={{
          marginTop: 'var(--espacio-sm)',
          padding: '0.625rem 1.25rem',
          borderRadius: 'var(--radio-lg)',
          backgroundColor: 'var(--color-primario)',
          color: '#fff',
          fontWeight: 700,
          textDecoration: 'none',
          fontFamily: 'var(--fuente-acento)',
        }}
      >
        Volver al inicio
      </Link>
    </main>
  );
}
