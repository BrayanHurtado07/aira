import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { restablecerPassword } from '../servicios/servicio-identidad'

type Estado = 'formulario' | 'exito' | 'error'

export function PaginaRestablecerPassword() {
  const [params]  = useSearchParams()
  const navegar   = useNavigate()

  const uid    = params.get('uid')    ?? ''
  const codigo = params.get('token')  ?? ''

  const [nueva, setNueva]             = useState('')
  const [confirmar, setConfirmar]     = useState('')
  const [enviando, setEnviando]       = useState(false)
  const [estado, setEstado]           = useState<Estado>(uid && codigo ? 'formulario' : 'error')
  const [errorLocal, setErrorLocal]   = useState('')

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nueva.length < 8) {
      setErrorLocal('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nueva !== confirmar) {
      setErrorLocal('Las contraseñas no coinciden.')
      return
    }
    setErrorLocal('')
    setEnviando(true)
    try {
      await restablecerPassword({ usuario_id: uid, codigo, nueva_contrasena: nueva })
      setEstado('exito')
    } catch {
      setEstado('error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={estilos.fondo}>
      <div style={estilos.tarjeta}>
        <div style={estilos.barraGold} />

        {estado === 'formulario' && (
          <>
            <h2 style={estilos.titulo}>Nueva contraseña</h2>
            <p style={estilos.subtitulo}>Elige una contraseña segura de al menos 8 caracteres.</p>
            <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <input
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="Nueva contraseña"
                required
                className="campo-input"
                style={estilos.input}
              />
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Confirmar contraseña"
                required
                className="campo-input"
                style={estilos.input}
              />
              {errorLocal && (
                <p style={estilos.errorMsg}>{errorLocal}</p>
              )}
              <button type="submit" disabled={enviando} style={{ ...estilos.boton, width: '100%' }}>
                {enviando ? 'Guardando…' : 'Guardar nueva contraseña →'}
              </button>
            </form>
          </>
        )}

        {estado === 'exito' && (
          <>
            <p style={{ ...estilos.titulo, color: '#4ADE80' }}>✓ Contraseña actualizada</p>
            <p style={estilos.subtitulo}>Tu contraseña fue cambiada con éxito. Ya puedes ingresar.</p>
            <button style={estilos.boton} onClick={() => navegar('/iniciar-sesion')}>
              Ir al inicio de sesión
            </button>
          </>
        )}

        {estado === 'error' && (
          <>
            <p style={{ ...estilos.titulo, color: '#EF4444' }}>Enlace inválido o expirado</p>
            <p style={estilos.subtitulo}>
              El enlace ya fue usado o venció. Solicita uno nuevo.
            </p>
            <button style={estilos.boton} onClick={() => navegar('/solicitar-reset')}>
              Solicitar nuevo enlace
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
}
