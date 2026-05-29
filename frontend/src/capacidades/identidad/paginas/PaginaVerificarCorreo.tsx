import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verificarCorreo } from '../servicios/servicio-identidad'

type Estado = 'verificando' | 'exito' | 'error'

export function PaginaVerificarCorreo() {
  const [params] = useSearchParams()
  const navegar  = useNavigate()
  const [estado, setEstado] = useState<Estado>('verificando')

  useEffect(() => {
    const uid    = params.get('uid')
    const codigo = params.get('token')

    if (!uid || !codigo) {
      setEstado('error')
      return
    }

    verificarCorreo({ usuario_id: uid, codigo })
      .then(() => setEstado('exito'))
      .catch(() => setEstado('error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={estilos.fondo}>
      <div style={estilos.tarjeta}>
        <div style={estilos.barraGold} />

        {estado === 'verificando' && (
          <>
            <p style={estilos.titulo}>Verificando correo…</p>
            <p style={estilos.subtitulo}>Un momento, estamos validando tu enlace.</p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <p style={{ ...estilos.titulo, color: '#4ADE80' }}>✓ Correo verificado</p>
            <p style={estilos.subtitulo}>Tu cuenta está activa. Ya puedes ingresar a Serbio.</p>
            <button
              style={estilos.boton}
              onClick={() => navegar('/iniciar-sesion')}
            >
              Ir al inicio de sesión
            </button>
          </>
        )}

        {estado === 'error' && (
          <>
            <p style={{ ...estilos.titulo, color: '#EF4444' }}>Enlace inválido o expirado</p>
            <p style={estilos.subtitulo}>
              El código ya fue usado o ha vencido. Solicita uno nuevo desde tu perfil.
            </p>
            <button
              style={estilos.boton}
              onClick={() => navegar('/iniciar-sesion')}
            >
              Volver al inicio de sesión
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
  } as React.CSSProperties,
  boton: {
    backgroundColor: '#C9A84C',
    color: '#111111',
    border: 'none',
    borderRadius: '0.625rem',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,
}
