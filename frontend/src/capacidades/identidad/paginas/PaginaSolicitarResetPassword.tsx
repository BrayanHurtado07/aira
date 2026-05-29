import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { solicitarResetPassword } from '../servicios/servicio-identidad'

export function PaginaSolicitarResetPassword() {
  const navegar   = useNavigate()
  const [correo, setCorreo]       = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [enviado, setEnviado]     = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correo.trim()) return
    setEnviando(true)
    try {
      await solicitarResetPassword({ correo_electronico: correo.trim() })
    } finally {
      // Siempre mostrar éxito para no revelar si el correo existe
      setEnviado(true)
      setEnviando(false)
    }
  }

  return (
    <div style={estilos.fondo}>
      <div style={estilos.tarjeta}>
        <div style={estilos.barraGold} />

        {enviado ? (
          <>
            <p style={{ ...estilos.titulo, color: '#4ADE80' }}>Revisa tu correo</p>
            <p style={estilos.subtitulo}>
              Si existe una cuenta con ese correo, recibirás un enlace para restablecer
              tu contraseña en los próximos minutos.
            </p>
            <button style={estilos.boton} onClick={() => navegar('/iniciar-sesion')}>
              Volver al inicio de sesión
            </button>
          </>
        ) : (
          <>
            <h2 style={estilos.titulo}>Restablecer contraseña</h2>
            <p style={estilos.subtitulo}>
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>
            <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@barberia.com"
                required
                className="campo-input"
                style={estilos.input}
              />
              <button type="submit" disabled={enviando} style={{ ...estilos.boton, width: '100%' }}>
                {enviando ? 'Enviando…' : 'Enviar enlace →'}
              </button>
            </form>
            <button
              style={{ ...estilos.enlace, marginTop: '1.25rem' }}
              onClick={() => navegar('/iniciar-sesion')}
            >
              ← Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const estilos = {
  fondo: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F0F',
    padding: '2rem',
  } as React.CSSProperties,
  tarjeta: {
    backgroundColor: '#1A1A1A',
    borderRadius: '1rem',
    border: '1px solid #2A2A2A',
    padding: '2.5rem 2rem',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
  } as React.CSSProperties,
  barraGold: {
    height: '3px',
    background: 'linear-gradient(90deg, #C9A84C 0%, #8B6A1F 100%)',
    borderRadius: '2px',
    marginLeft: '-2rem',
    marginRight: '-2rem',
    marginTop: '-2.5rem',
    marginBottom: '1.75rem',
    borderTopLeftRadius: '1rem',
    borderTopRightRadius: '1rem',
  } as React.CSSProperties,
  titulo: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#EFEFEF',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  subtitulo: {
    fontSize: '0.875rem',
    color: '#7A7A7A',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
    textAlign: 'left' as const,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #2A2A2A',
    borderRadius: '0.625rem',
    fontSize: '0.9375rem',
    color: '#EFEFEF',
    backgroundColor: '#222222',
    outline: 'none',
    boxSizing: 'border-box' as const,
    textAlign: 'left' as const,
  } as React.CSSProperties,
  boton: {
    backgroundColor: '#C9A84C',
    color: '#111111',
    border: 'none',
    borderRadius: '0.625rem',
    padding: '0.875rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,
  enlace: {
    background: 'none',
    border: 'none',
    color: '#7A7A7A',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    display: 'block',
  } as React.CSSProperties,
}
