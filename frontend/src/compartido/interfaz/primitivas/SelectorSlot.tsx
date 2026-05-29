import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import { CalendarDays, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react'
import 'react-day-picker/style.css'
import { usarDisponibilidadBarbero } from '@/capacidades/agenda/ganchos/usarDisponibilidadBarbero'
import { usarSlotsDisponibles } from '@/capacidades/agenda/ganchos/usarSlotsDisponibles'

interface PropiedadesSelectorSlot {
  barberoId:          string
  servicioId:         string
  valor:              string
  alCambiar:          (fechaHoraInicio: string) => void
  alCambiarSucursal?: (sucursalId: string) => void
  error?:             boolean
  deshabilitado?:     boolean
  id?:                string
}

function fechaAString(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function combinarFechaHora(fecha: Date, hora: string): string {
  return `${fechaAString(fecha)}T${hora}`
}

function parsearValor(valor: string): { fecha: Date | null; hora: string } {
  if (!valor) return { fecha: null, hora: '' }
  const [datePart, timePart = ''] = valor.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  return { fecha: new Date(y, mo - 1, d), hora: timePart.slice(0, 5) }
}

export function SelectorSlot({
  barberoId,
  servicioId,
  valor,
  alCambiar,
  alCambiarSucursal,
  error = false,
  deshabilitado = false,
  id,
}: PropiedadesSelectorSlot) {
  const [abierto,           setAbierto]           = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(undefined)
  const popoverRef = useRef<HTMLDivElement>(null)
  const botonRef   = useRef<HTMLButtonElement>(null)

  const { bloques }            = usarDisponibilidadBarbero(barberoId || undefined)
  const diasConDisponibilidad  = new Set(bloques.map((b) => b.dia_semana))
  const fechaStr               = fechaSeleccionada ? fechaAString(fechaSeleccionada) : ''
  const { slots, sucursalId, cargando: cargandoSlots, sinHorarios } =
    usarSlotsDisponibles(barberoId, servicioId, fechaStr)

  useEffect(() => {
    if (sucursalId && alCambiarSucursal) alCambiarSucursal(sucursalId)
  }, [sucursalId, alCambiarSucursal])

  const { fecha: fechaActual, hora: horaActual } = parsearValor(valor)
  const etiqueta = fechaActual && horaActual
    ? format(fechaActual, "EEE d 'de' MMMM", { locale: es }) + ` · ${horaActual}`
    : !barberoId || !servicioId
      ? 'Selecciona barbero y servicio primero'
      : 'Seleccionar fecha y hora'

  const estaDeshabilitado = deshabilitado || !barberoId || !servicioId

  // ── Bloquear scroll del body cuando el modal está abierto ─────────────────
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [abierto])

  // ── Cerrar con Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!abierto) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [abierto])

  // ── Limpiar fecha al cambiar barbero/servicio ──────────────────────────────
  useEffect(() => {
    setFechaSeleccionada(undefined)
  }, [barberoId, servicioId])

  const seleccionarDia = (dia: Date | undefined) => {
    setFechaSeleccionada(dia)
    if (dia) alCambiar('')
  }

  const seleccionarSlot = (hora: string) => {
    if (!fechaSeleccionada) return
    alCambiar(combinarFechaHora(fechaSeleccionada, hora))
    setAbierto(false)
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const esDiaDeshabilitado = (date: Date): boolean => {
    if (date < hoy) return true
    if (!barberoId || diasConDisponibilidad.size === 0) return true
    return !diasConDisponibilidad.has(date.getDay())
  }

  // ── Portal: overlay + modal centrado ─────────────────────────────────────
  const modalNode = abierto ? ReactDOM.createPortal(
    <>
      {/* Overlay — clic cierra el modal */}
      <div
        className="selector-fecha-overlay"
        onClick={() => setAbierto(false)}
        aria-hidden="true"
      />

      {/* Modal centrado */}
      <div
        ref={popoverRef}
        className="selector-slot-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar fecha y hora"
      >
        {/* Cabecera sticky */}
        <div className="selector-slot-modal-cabecera">
          <span className="selector-slot-modal-titulo">Fecha y hora</span>
          <button
            type="button"
            className="selector-fecha-modal-cerrar"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar"
          >
            <X size={15} />
          </button>
        </div>

        {/* Calendario */}
        <div className="selector-slot-calendario">
          <DayPicker
            mode="single"
            selected={fechaSeleccionada}
            onSelect={seleccionarDia}
            locale={es}
            weekStartsOn={1}
            showOutsideDays
            disabled={esDiaDeshabilitado}
            components={{
              PreviousMonthButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
                <button {...props} className="rdp-nav-btn"><ChevronLeft size={14} /></button>
              ),
              NextMonthButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
                <button {...props} className="rdp-nav-btn"><ChevronRight size={14} /></button>
              ),
            }}
          />
        </div>

        {/* Panel de slots horarios */}
        {fechaSeleccionada ? (
          <div className="selector-slot-panel">
            <div className="selector-slot-panel-header">
              <Clock size={12} style={{ color: 'var(--color-texto-suave)' }} />
              <span>{format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}</span>
            </div>

            {cargandoSlots ? (
              <div className="selector-slot-estado">
                <span className="selector-slot-cargando">Calculando horarios…</span>
              </div>
            ) : sinHorarios ? (
              <div className="selector-slot-estado">
                <span className="selector-slot-vacio">Sin horarios disponibles ese día</span>
              </div>
            ) : (
              <div className="selector-slot-grid">
                {slots.map((hora) => (
                  <button
                    key={hora}
                    type="button"
                    onClick={() => seleccionarSlot(hora)}
                    className={[
                      'selector-slot-btn',
                      horaActual === hora &&
                        fechaSeleccionada &&
                        fechaAString(fechaSeleccionada) === fechaAString(fechaActual ?? new Date())
                        ? 'selector-slot-btn--seleccionado'
                        : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="selector-slot-panel">
            <div className="selector-slot-estado">
              <span className="selector-slot-vacio">
                Selecciona un día disponible en el calendario
              </span>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        id={id}
        disabled={estaDeshabilitado}
        onClick={() => { if (!estaDeshabilitado) setAbierto((p) => !p) }}
        className={[
          'selector-slot-trigger',
          abierto           ? 'selector-slot-trigger--abierto'    : '',
          error             ? 'selector-slot-trigger--error'       : '',
          !valor            ? 'selector-slot-trigger--placeholder' : '',
        ].filter(Boolean).join(' ')}
      >
        <CalendarDays size={14} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', textTransform: 'capitalize' }}>
          {etiqueta}
        </span>
      </button>

      {modalNode}
    </>
  )
}
