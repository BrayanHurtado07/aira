import { Check, Image, Mic, FileText } from 'lucide-react'
import type { Mensaje } from '../contratos/tipos'
import { horaCorta } from '../utilidades/formato'

// Etiqueta + ícono para tipos que no son texto. El backend no entrega la URL del
// medio todavía, así que mostramos un marcador honesto en lugar de fingir media.
const TIPOS_MEDIA: Record<string, { icono: typeof Image; etiqueta: string }> = {
  IMAGEN: { icono: Image, etiqueta: 'Imagen' },
  AUDIO: { icono: Mic, etiqueta: 'Audio' },
  DOCUMENTO: { icono: FileText, etiqueta: 'Documento' },
}

export function BurbujaMensaje({ mensaje }: { mensaje: Mensaje }) {
  const esSaliente = mensaje.direccion === 'SALIDA'
  const media = TIPOS_MEDIA[mensaje.tipo?.toUpperCase?.() ?? '']

  return (
    <div className={`wa-burbuja-fila wa-burbuja-fila--${esSaliente ? 'saliente' : 'entrante'}`}>
      <div className={`wa-burbuja wa-burbuja--${esSaliente ? 'saliente' : 'entrante'}`}>
        {media && (
          <span className="wa-burbuja-media">
            <media.icono size={14} aria-hidden /> {media.etiqueta}
          </span>
        )}
        <span className="wa-burbuja-texto">{mensaje.contenido}</span>
        <span className="wa-burbuja-meta">
          {horaCorta(mensaje.creado_en)}
          {esSaliente && <Check size={13} aria-label="Enviado" />}
        </span>
      </div>
    </div>
  )
}
