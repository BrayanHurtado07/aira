import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Send } from 'lucide-react'

type Props = {
  onEnviar: (contenido: string) => void
  enviando: boolean
  deshabilitada?: boolean
}

// Métodos imperativos que exponemos al padre (para insertar un atajo).
export type CajaRespuestaHandle = {
  insertar: (texto: string) => void
}

const ALTO_MAX = 140

// Caja de respuesta manual del negocio. Textarea que crece con el contenido;
// Enter envía, Shift+Enter agrega salto de línea. Expone insertar() para atajos.
export const CajaRespuesta = forwardRef<CajaRespuestaHandle, Props>(function CajaRespuesta(
  { onEnviar, enviando, deshabilitada = false },
  ref,
) {
  const [contenido, setContenido] = useState('')
  const refArea = useRef<HTMLTextAreaElement>(null)

  function ajustarAlto() {
    const el = refArea.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, ALTO_MAX)}px`
  }

  useImperativeHandle(ref, () => ({
    insertar: (texto: string) => {
      setContenido((prev) => (prev.trim() ? `${prev} ${texto}` : texto))
      requestAnimationFrame(() => {
        ajustarAlto()
        refArea.current?.focus()
      })
    },
  }))

  function enviar() {
    const texto = contenido.trim()
    if (!texto || enviando || deshabilitada) return
    onEnviar(texto)
    setContenido('')
    if (refArea.current) refArea.current.style.height = 'auto'
  }

  function manejarTecla(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  if (deshabilitada) {
    return (
      <div className="wa-caja wa-caja--bloqueada">
        Esta conversación está cerrada. No se pueden enviar mensajes.
      </div>
    )
  }

  return (
    <div className="wa-caja">
      <textarea
        ref={refArea}
        className="wa-caja-input"
        rows={1}
        value={contenido}
        onChange={(e) => { setContenido(e.target.value); ajustarAlto() }}
        onKeyDown={manejarTecla}
        placeholder="Escribe un mensaje… (Enter para enviar)"
        disabled={enviando}
        aria-label="Escribir mensaje"
      />
      <button
        type="button"
        className="wa-caja-enviar"
        onClick={enviar}
        disabled={!contenido.trim() || enviando}
        aria-label="Enviar mensaje"
      >
        <Send size={18} aria-hidden />
      </button>
    </div>
  )
})
