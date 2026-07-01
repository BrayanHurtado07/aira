import { useEffect, useMemo, useRef } from 'react'
import { ArrowLeft, Bot } from 'lucide-react'
import { Avatar } from '@/compartido/interfaz/primitivas/Avatar'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { Cargando } from '@/compartido/interfaz/retroalimentacion/Cargando'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { toast } from 'sonner'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { Conversacion } from '../contratos/tipos'
import { usarMensajes } from '../ganchos/usarMensajes'
import { BurbujaMensaje } from './BurbujaMensaje'
import { SeparadorFecha } from './SeparadorFecha'
import { CajaRespuesta, type CajaRespuestaHandle } from './CajaRespuesta'
import { LineaAtajos } from './LineaAtajos'
import { formatearTelefono, separadorDia, claveDia, etiquetaEstado, varianteEstado } from '../utilidades/formato'

type Props = {
  conversacionId: string
  conversacion?: Conversacion
  onVolver: () => void
}

// Detalle de una conversación: cabecera con identidad del cliente, hilo de
// mensajes agrupado por día y caja de respuesta manual.
export function PanelConversacion({ conversacionId, conversacion, onVolver }: Props) {
  const { mensajes, cargando, error, enviar, enviando } = usarMensajes(conversacionId)
  const finRef = useRef<HTMLDivElement>(null)
  const cajaRef = useRef<CajaRespuestaHandle>(null)

  const numero = conversacion ? formatearTelefono(conversacion.numero_cliente) : 'Conversación'
  const esActiva = conversacion ? conversacion.estado === 'ACTIVA' : true

  // Agrupa los mensajes por jornada para intercalar separadores de fecha.
  const grupos = useMemo(() => {
    const out: { dia: string; etiqueta: string; mensajes: typeof mensajes }[] = []
    for (const m of mensajes) {
      const dia = claveDia(m.creado_en)
      const ultimo = out[out.length - 1]
      if (ultimo && ultimo.dia === dia) ultimo.mensajes.push(m)
      else out.push({ dia, etiqueta: separadorDia(m.creado_en), mensajes: [m] })
    }
    return out
  }, [mensajes])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes.length])

  return (
    <div className="wa-conversacion">
      <header className="wa-conv-cabecera">
        <button type="button" className="wa-volver" onClick={onVolver} aria-label="Volver a la lista">
          <ArrowLeft size={18} aria-hidden />
        </button>
        <Avatar nombre={numero} colorAuto tamano="md" />
        <div className="wa-conv-identidad">
          <span className="wa-conv-numero">{numero}</span>
          <span className="wa-conv-sub">
            <Bot size={12} aria-hidden /> Atendido por Aira IA
          </span>
        </div>
        {conversacion && (
          <Insignia variante={varianteEstado(conversacion.estado)} estilo={{ marginLeft: 'auto' }}>
            {etiquetaEstado(conversacion.estado)}
          </Insignia>
        )}
      </header>

      <div className="wa-conv-hilo">
        {cargando && <Cargando mensaje="Cargando mensajes…" />}

        {!cargando && error && (
          <div style={{ padding: 'var(--espacio-md)' }}>
            <BannerAlerta
              variante="error"
              titulo="No se pudieron cargar los mensajes"
              mensaje={mensajeDeError(error)}
            />
          </div>
        )}

        {!cargando && !error && mensajes.length === 0 && (
          <Vacio titulo="Sin mensajes" mensaje="Aún no hay mensajes en esta conversación." />
        )}

        {!cargando && !error && grupos.map((g) => (
          <div key={g.dia}>
            <SeparadorFecha etiqueta={g.etiqueta} />
            {g.mensajes.map((m) => (
              <BurbujaMensaje key={m.id} mensaje={m} />
            ))}
          </div>
        ))}

        <div ref={finRef} />
      </div>

      {esActiva && <LineaAtajos onUsar={(texto) => cajaRef.current?.insertar(texto)} />}

      <CajaRespuesta
        ref={cajaRef}
        onEnviar={(contenido) =>
          enviar(contenido, {
            onError: (err) => toast.error(mensajeDeError(err)),
          })
        }
        enviando={enviando}
        deshabilitada={!esActiva}
      />
    </div>
  )
}
