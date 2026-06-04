import { useState } from 'react'
import { ArrowLeft, Scissors, User, Clock, Calendar, CheckCircle } from 'lucide-react'
import type { SeleccionReserva } from '../contratos/tipos'
import { crearReservaPublica } from '../servicios/servicio-reserva-publica'

type DatosCliente = { nombre: string; telefono: string; correo: string }

type Props = {
  seleccion: SeleccionReserva
  cliente: DatosCliente
  onAnterior: () => void
  onExito: () => void
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function formatearFecha(iso: string, horaInicio: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return `${dias[fecha.getDay()]} ${dia} de ${MESES[mes - 1]}, ${horaInicio.slice(0, 5)}`
}

export function PasoConfirmacion({ seleccion, cliente, onAnterior, onExito }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async () => {
    if (!seleccion.servicio || !seleccion.barbero || !seleccion.slot) return
    setEnviando(true)
    setError('')
    try {
      await crearReservaPublica({
        empresa_id: seleccion.empresaID,
        sucursal_id: seleccion.sucursalID,
        barbero_id: seleccion.barbero.id,
        servicio_id: seleccion.servicio.id,
        fecha_hora_inicio: `${seleccion.fecha}T${seleccion.slot.hora_inicio}`,
        cliente_nombre: cliente.nombre,
        cliente_telefono: cliente.telefono,
        cliente_correo: cliente.correo || undefined,
      })
      onExito()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al crear la reserva'
      setError(msg)
    } finally {
      setEnviando(false)
    }
  }

  const { servicio, barbero, slot, fecha } = seleccion

  return (
    <div>
      <h2 className="reserva-paso__titulo">Revisa tu reserva</h2>
      <p className="reserva-paso__descripcion">
        Confirma los detalles antes de reservar tu cita.
      </p>

      <div className="reserva-resumen">
        <div className="reserva-resumen__fila">
          <Scissors size={18} className="reserva-resumen__icono" />
          <div>
            <div className="reserva-resumen__etiqueta">Servicio</div>
            <div className="reserva-resumen__valor">{servicio?.nombre}</div>
          </div>
        </div>
        <div className="reserva-resumen__fila">
          <User size={18} className="reserva-resumen__icono" />
          <div>
            <div className="reserva-resumen__etiqueta">Barbero</div>
            <div className="reserva-resumen__valor">{barbero?.nombre}</div>
          </div>
        </div>
        <div className="reserva-resumen__fila">
          <Calendar size={18} className="reserva-resumen__icono" />
          <div>
            <div className="reserva-resumen__etiqueta">Fecha y hora</div>
            <div className="reserva-resumen__valor">
              {slot && fecha ? formatearFecha(fecha, slot.hora_inicio) : '—'}
            </div>
          </div>
        </div>
        <div className="reserva-resumen__fila">
          <Clock size={18} className="reserva-resumen__icono" />
          <div>
            <div className="reserva-resumen__etiqueta">Duración · Precio</div>
            <div className="reserva-resumen__valor">
              {servicio?.duracion_minutos} min · S/. {servicio?.precio.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="reserva-resumen__fila">
          <User size={18} className="reserva-resumen__icono" />
          <div>
            <div className="reserva-resumen__etiqueta">Cliente</div>
            <div className="reserva-resumen__valor">{cliente.nombre}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-texto-suave)' }}>
              {cliente.telefono}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--color-error-suave)',
            border: '1px solid var(--color-error)',
            borderRadius: '0.5rem',
            color: 'var(--color-error)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            maxWidth: 480,
          }}
        >
          {error}
        </div>
      )}

      <div className="reserva-navegacion">
        <button
          type="button"
          className="reserva-btn reserva-btn--secundario"
          onClick={onAnterior}
          disabled={enviando}
        >
          <ArrowLeft size={16} />
          Anterior
        </button>
        <button
          type="button"
          className="reserva-btn reserva-btn--primario"
          onClick={confirmar}
          disabled={enviando}
        >
          {enviando ? 'Reservando…' : (
            <>
              <CheckCircle size={16} />
              Confirmar reserva
            </>
          )}
        </button>
      </div>
    </div>
  )
}
