import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { solicitarResetPassword } from '../servicios/servicio-identidad';

export function PaginaSolicitarResetPassword() {
  const navegar = useNavigate();
  const [correo, setCorreo]     = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado]   = useState(false);

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!correo.trim()) return;
    setEnviando(true);
    try {
      await solicitarResetPassword({ correo_electronico: correo.trim() });
    } finally {
      setEnviado(true);
      setEnviando(false);
    }
  };

  return (
    <div style={e.fondo}>
      <div style={e.tarjeta}>
        {/* Franja tricolor superior */}
        <div style={{ display: 'flex', height: '3px', marginLeft: '-2rem', marginRight: '-2rem', marginTop: '-2.5rem', marginBottom: '1.75rem' }}>
          <span style={{ flex: 1, background: '#CC1C2E' }} />
          <span style={{ flex: 1, background: '#1B3A8C' }} />
          <span style={{ flex: 1, background: '#F8F5F0' }} />
        </div>

        {enviado ? (
          <>
            <p style={{ ...e.titulo, color: '#22C55E' }}>Revisa tu correo</p>
            <p style={e.subtitulo}>
              Si existe una cuenta con ese correo, recibirás un enlace para restablecer
              tu contraseña en los próximos minutos.
            </p>
            <button style={e.boton} onClick={() => navegar('/iniciar-sesion')}>
              Volver al inicio de sesión
            </button>
          </>
        ) : (
          <>
            <h2 style={e.titulo}>Restablecer contraseña</h2>
            <p style={e.subtitulo}>
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>
            <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                value={correo}
                onChange={(el) => setCorreo(el.target.value)}
                placeholder="correo@barberia.com"
                required
                className="campo-input"
              />
              <button type="submit" disabled={enviando} style={{ ...e.boton, width: '100%' }}>
                {enviando ? 'Enviando…' : 'Enviar enlace →'}
              </button>
            </form>
            <button style={e.enlace} onClick={() => navegar('/iniciar-sesion')}>
              ← Volver al inicio de sesión
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
    textAlign: 'left' as const,
  } as React.CSSProperties,
  boton: {
    backgroundColor: '#CC1C2E',
    color: '#fff',
    border: 'none',
    borderRadius: '0.625rem',
    padding: '0.875rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    fontFamily: "'Oswald', Impact, sans-serif",
  } as React.CSSProperties,
  enlace: {
    background: 'none',
    border: 'none',
    color: 'rgba(248,245,240,0.35)',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    display: 'block',
    marginTop: '1.25rem',
  } as React.CSSProperties,
};
