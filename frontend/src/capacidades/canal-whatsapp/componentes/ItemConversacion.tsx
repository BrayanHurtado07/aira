import { Avatar } from '@/compartido/interfaz/primitivas/Avatar'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import type { Conversacion } from '../contratos/tipos'
import { formatearTelefono, etiquetaFechaRelativa, etiquetaEstado, varianteEstado } from '../utilidades/formato'

type Props = {
  conversacion: Conversacion
  activa: boolean
  onSeleccionar: (id: string) => void
}

// Una fila de la bandeja: identidad por número (avatar + teléfono), estado y
// hora. No muestra "último mensaje" ni "sin leer" porque el backend no los provee.
export function ItemConversacion({ conversacion, activa, onSeleccionar }: Props) {
  const numero = formatearTelefono(conversacion.numero_cliente)

  return (
    <button
      type="button"
      className={`wa-item${activa ? ' wa-item--activa' : ''}`}
      onClick={() => onSeleccionar(conversacion.id)}
      aria-pressed={activa}
    >
      <Avatar nombre={numero} colorAuto tamano="md" />

      <div className="wa-item-cuerpo">
        <div className="wa-item-fila-sup">
          <span className="wa-item-numero">{numero}</span>
          <span className="wa-item-hora">{etiquetaFechaRelativa(conversacion.creado_en)}</span>
        </div>
        <div className="wa-item-fila-inf">
          <Insignia variante={varianteEstado(conversacion.estado)}>
            {etiquetaEstado(conversacion.estado)}
          </Insignia>
        </div>
      </div>
    </button>
  )
}
