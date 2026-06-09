import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { restablecerPassword } from '../servicios/servicio-identidad';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';

type Estado = 'formulario' | 'exito' | 'error';

export function PaginaRestablecerPassword() {
  const [params] = useSearchParams();
  const navegar = useNavigate();

  const uid    = params.get('uid')   ?? '';
  const codigo = params.get('token') ?? '';

  const [nueva, setNueva]           = useState('');
  const [confirmar, setConfirmar]   = useState('');
  const [enviando, setEnviando]     = useState(false);
  const [estado, setEstado]         = useState<Estado>(uid && codigo ? 'formulario' : 'error');
  const [errorLocal, setErrorLocal] = useState('');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nueva.length < 8) {
      setErrorLocal('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      setErrorLocal('Las contraseñas no coinciden.');
      return;
    }
    setErrorLocal('');
    setEnviando(true);
    try {
      await restablecerPassword({ usuario_id: uid, codigo, nueva_contrasena: nueva });
      setEstado('exito');
    } catch {
      setEstado('error');
    } finally {
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

        {estado === 'formulario' && (
          <>
            <h2 style={e.titulo}>Nueva contraseña</h2>
            <p style={e.subtitulo}>Elige una contraseña segura de al menos 8 caracteres.</p>
            <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <Campo
                etiqueta="Nueva contraseña"
                requerido
                type="password"
                value={nueva}
                onChange={(ev) => setNueva(ev.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <Campo
                etiqueta="Confirmar contraseña"
                requerido
                type="password"
                value={confirmar}
                onChange={(ev) => setConfirmar(ev.target.value)}
                placeholder="Repite la nueva contraseña"
                error={errorLocal || undefined}
              />
              <button type="submit" disabled={enviando} style={{ ...e.boton, width: '100%' }}>
                {enviando ? 'Guardando…' : 'Guardar nueva contraseña →'}
              </button>
            </form>
          </>
        )}

        {estado === 'exito' && (
          <>
            <p style={{ ...e.titulo, color: '#22C55E' }}>✓ Contraseña actualizada</p>
            <p style={e.subtitulo}>Tu contraseña fue cambiada con éxito. Ya puedes ingresar.</p>
            <button style={e.boton} onClick={() => navegar('/iniciar-sesion')}>Ir al inicio de sesión</button>
          </>
        )}

        {estado === 'error' && (
          <>
            <p style={{ ...e.titulo, color: '#EF4444' }}>Enlace inválido o expirado</p>
            <p style={e.subtitulo}>El enlace ya fue usado o venció. Solicita uno nuevo.</p>
            <button style={e.boton} onClick={() => navegar('/solicitar-reset')}>Solicitar nuevo enlace</button>
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
  errorMsg: {
    fontSize: '0.875rem',
    color: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    margin: 0,
    border: '1px solid rgba(239,68,68,0.2)',
    textAlign: 'left' as const,
  } as React.CSSProperties,
};
