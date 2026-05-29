import React from 'react';
import type { Mensaje } from '../contratos/tipos'

type Props = {
  mensaje: Mensaje
}

export function BurbujaMensaje({ mensaje }: Props) {
  const esSaliente = mensaje.direccion === 'SALIENTE'

  const estiloContenedor: React.CSSProperties = {
    display: 'flex',
    justifyContent: esSaliente ? 'flex-end' : 'flex-start',
    marginBottom: 'var(--espacio-md)',
  }

  const estiloBurbuja: React.CSSProperties = {
    maxWidth: '70%',
    padding: 'var(--espacio-md)',
    borderRadius: 'var(--radio-md)',
    backgroundColor: esSaliente ? 'var(--color-acento)' : 'var(--color-borde)',
    color: esSaliente ? '#fff' : 'var(--color-texto)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  }

  const estiloMeta: React.CSSProperties = {
    fontSize: '0.7rem',
    opacity: 0.7,
    marginTop: '4px',
    textAlign: esSaliente ? 'right' : 'left',
    color: esSaliente ? '#fff' : 'var(--color-texto)',
  }

  return (
    <div style={estiloContenedor}>
      <div>
        <div style={estiloBurbuja}>
          {mensaje.contenido}
        </div>
        <div style={estiloMeta}>
          {new Date(mensaje.creado_en).toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {' · '}
          {esSaliente ? 'Enviado' : 'Recibido'}
        </div>
      </div>
    </div>
  )
}
