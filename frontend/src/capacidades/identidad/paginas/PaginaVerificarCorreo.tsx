import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verificarCorreo } from '../servicios/servicio-identidad';

type Estado = 'verificando' | 'exito' | 'error';

export function PaginaVerificarCorreo() {
  const [params] = useSearchParams();
  const navegar  = useNavigate();
  const [estado, setEstado] = useState<Estado>('verificando');

  useEffect(() => {
    const uid    = params.get('uid');
    const codigo = params.get('token');

    if (!uid || !codigo) {
      setEstado('error');
      return;
    }

    verificarCorreo({ usuario_id: uid, codigo })
      .then(() => setEstado('exito'))
      .catch(() => setEstado('error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={e.fondo}>
      <div style={e.tarjeta}>
        {/* Franja tricolor superior */}
        <div style={{ display: 'flex', height: '3px', marginLeft: '-2rem', marginRight: '-2rem', marginTop: '-2.5rem', marginBottom: '1.75rem' }}>
          <span style={{ flex: 1, background: '#CC1C2E' }} />
          <span style={{ flex: 1, background: '#1B3A8C' }} />
          <span style={{ flex: 1, background: '#F8F5F0' }} />
        </div>

        {estado === 'verificando' && (
          <>
            <p style={e.titulo}>Verificando correo…</p>
            <p style={e.subtitulo}>Un momento, estamos validando tu enlace.</p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <p style={{ ...e.titulo, color: '#22C55E' }}>✓ Correo verificado</p>
            <p style={e.subtitulo}>Tu cuenta está activa. Ya puedes ingresar a AIRA.</p>
            <button style={e.boton} onClick={() => navegar('/iniciar-sesion')}>
              Ir al inicio de sesión
            </button>
          </>
        )}

        {estado === 'error' && (
          <>
            <p style={{ ...e.titulo, color: '#EF4444' }}>Enlace inválido o expirado</p>
            <p style={e.subtitulo}>
              El código ya fue usado o ha vencido. Solicita uno nuevo desde tu perfil.
            </p>
            <button style={e.boton} onClick={() => navegar('/iniciar-sesion')}>
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const e = {
  fondo: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    padding: '2rem',
  } as React.CSSProperties,
  tarjeta: {
    backgroundColor: '#111111',
    borderRadius: '1rem',
    border: '1px solid rgba(248,245,240,0.08)',
    padding: '2.5rem 2rem',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow: '0 24px 56px rgba(0,0,0,0.6)',
  } as React.CSSProperties,
  titulo: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#F8F5F0',
    marginBottom: '0.5rem',
    fontFamily: "'Playfair Display', Georgia, serif",
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  subtitulo: {
    fontSize: '0.875rem',
    color: 'rgba(248,245,240,0.42)',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  boton: {
    backgroundColor: '#CC1C2E',
    color: '#fff',
    border: 'none',
    borderRadius: '0.625rem',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    fontFamily: "'Oswald', Impact, sans-serif",
  } as React.CSSProperties,
};
