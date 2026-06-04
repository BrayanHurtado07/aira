import { Clock, ArrowRight } from 'lucide-react'
import type { Servicio } from '../contratos/tipos'

type Props = {
  servicios: Servicio[]
  seleccionado: Servicio | null
  onSeleccionar: (s: Servicio) => void
  onSiguiente: () => void
  cargando: boolean
}

export function PasoServicio({ servicios, seleccionado, onSeleccionar, onSiguiente, cargando }: Props) {
  if (cargando) {
    return (
      <div className="reserva-cargando">
        <div className="reserva-cargando__spinner" />
        Cargando servicios…
      </div>
    )
  }

  const activos = servicios.filter((s) => s.estado === 'ACTIVO')

  return (
    <div>
      <h2 className="reserva-paso__titulo">¿Qué servicio necesitas?</h2>
      <p className="reserva-paso__descripcion">
        Selecciona el servicio para tu visita.
      </p>

      <div className="servicios-grid">
        {activos.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`servicio-card${seleccionado?.id === s.id ? ' servicio-card--seleccionado' : ''}`}
            onClick={() => onSeleccionar(s)}
          >
            <div className="servicio-card__nombre">{s.nombre}</div>
            <div className="servicio-card__duracion">
              <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
              {s.duracion_minutos} min
            </div>
            <div className="servicio-card__precio">S/. {s.precio.toFixed(2)}</div>
          </button>
        ))}
      </div>

      <div className="reserva-navegacion" style={{ justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="reserva-btn reserva-btn--primario"
          disabled={!seleccionado}
          onClick={onSiguiente}
        >
          Siguiente
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
