import React from 'react';
import { useState } from 'react'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'

type Props = {
  onEnviar: (contenido: string) => void
  enviando: boolean
}

export function CajaRespuesta({ onEnviar, enviando }: Props) {
  const [contenido, setContenido] = useState('')

  function manejarEnvio() {
    const texto = contenido.trim()
    if (!texto) return
    onEnviar(texto)
    setContenido('')
  }

  function manejarTecla(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      manejarEnvio()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--espacio-md)',
        alignItems: 'flex-end',
        padding: 'var(--espacio-md)',
        borderTop: '1px solid var(--color-borde)',
        backgroundColor: 'var(--color-fondo)',
      }}
    >
      <div style={{ flex: 1 }}>
        <Campo
          etiqueta=""
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          onKeyDown={manejarTecla}
          placeholder="Escribe un mensaje... (Enter para enviar)"
          disabled={enviando}
        />
      </div>
      <Boton
        onClick={manejarEnvio}
        disabled={!contenido.trim() || enviando}
      >
        {enviando ? 'Enviando...' : 'Enviar'}
      </Boton>
    </div>
  )
}
