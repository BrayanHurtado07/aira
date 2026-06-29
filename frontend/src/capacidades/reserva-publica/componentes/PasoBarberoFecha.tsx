import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Barbero, Servicio, BloqueDisponibilidad } from '../contratos/tipos'
import { obtenerSlotsPublicos } from '../servicios/servicio-reserva-publica'

type Props = {
  barberos: Barbero[]
  servicio: Servicio
  barberoSeleccionado: Barbero | null
  slotSeleccionado: BloqueDisponibilidad | null
  fechaSeleccionada: string
  onBarbero: (b: Barbero) => void
  onSlot: (s: BloqueDisponibilidad, fecha: string) => void
  onAnterior: () => void
  onSiguiente: () => void
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function generarProximos14Dias(): Date[] {
  const dias: Date[] = []
  const hoy = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() + i)
    dias.push(d)
  }
  return dias
}

function formatoISO(fecha: Date): string {
  return fecha.toISOString().split('T')[0]
}

export function PasoBarberoFecha({
  barberos,
  servicio,
  barberoSeleccionado,
  slotSeleccionado,
  fechaSeleccionada,
  onBarbero,
  onSlot,
  onAnterior,
  onSiguiente,
}: Props) {
  const dias = generarProximos14Dias()
  const [fechaLocal, setFechaLocal] = useState(fechaSeleccionada || formatoISO(dias[0]))
  const [slots, setSlots] = useState<BloqueDisponibilidad[]>([])
  const [cargandoSlots, setCargandoSlots] = useState(false)

  useEffect(() => {
    if (!barberoSeleccionado || !fechaLocal) return
    setCargandoSlots(true)
    obtenerSlotsPublicos(barberoSeleccionado.id, servicio.id, fechaLocal)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setCargandoSlots(false))
  }, [barberoSeleccionado, fechaLocal, servicio.id])

  const slotsLibres = slots.filter((s) => s.estado === 'LIBRE')

  const handleFecha = (d: Date) => {
    setFechaLocal(formatoISO(d))
    onSlot(null as unknown as BloqueDisponibilidad, '')
  }

  const handleSlot = (s: BloqueDisponibilidad) => {
    onSlot(s, fechaLocal)
  }

  const puedeSiguiente = !!barberoSeleccionado && !!slotSeleccionado

  return (
    <div>
      <h2 className="reserva-paso__titulo">¿Cuándo y con quién?</h2>
      <p className="reserva-paso__descripcion">Elige tu barbero y el horario que más te convenga.</p>

      <div className="barberos-grid">
        {barberos.map((b) => {
          const inicial = (b.nombre ?? '').charAt(0).toUpperCase() || '?'
          return (
            <button
              key={b.id}
              type="button"
              className={`barbero-card${barberoSeleccionado?.id === b.id ? ' barbero-card--seleccionado' : ''}`}
              onClick={() => onBarbero(b)}
            >
              <div className="barbero-card__avatar">{inicial}</div>
              <div className="barbero-card__nombre">{b.nombre}</div>
            </button>
          )
        })}
      </div>

      {barberoSeleccionado && (
        <>
          <p className="slots-titulo">Selecciona un día</p>
          <div className="fechas-selector">
            {dias.map((d) => {
              const iso = formatoISO(d)
              const seleccionada = iso === fechaLocal
              return (
                <button
                  key={iso}
                  type="button"
                  className={`fecha-boton${seleccionada ? ' fecha-boton--seleccionada' : ''}`}
                  onClick={() => handleFecha(d)}
                >
                  <span className="fecha-boton__dia-semana">{DIAS_SEMANA[d.getDay()]}</span>
                  <span className="fecha-boton__numero">{d.getDate()}</span>
                  <span className="fecha-boton__mes">{MESES[d.getMonth()]}</span>
                </button>
              )
            })}
          </div>

          <p className="slots-titulo">Horarios disponibles</p>
          {cargandoSlots ? (
            <div className="reserva-cargando">
              <div className="reserva-cargando__spinner" />
              Consultando disponibilidad…
            </div>
          ) : slotsLibres.length === 0 ? (
            <p className="slots-vacio">No hay horarios disponibles para esta fecha.</p>
          ) : (
            <div className="slots-grid">
              {slotsLibres.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`slot-boton${slotSeleccionado?.id === s.id ? ' slot-boton--seleccionado' : ''}`}
                  onClick={() => handleSlot(s)}
                >
                  {s.hora_inicio.slice(0, 5)}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="reserva-navegacion">
        <button type="button" className="reserva-btn reserva-btn--secundario" onClick={onAnterior}>
          <ArrowLeft size={16} />
          Anterior
        </button>
        <button
          type="button"
          className="reserva-btn reserva-btn--primario"
          disabled={!puedeSiguiente}
          onClick={onSiguiente}
        >
          Siguiente
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
