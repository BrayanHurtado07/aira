import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { FormularioReserva } from './FormularioReserva'
import { registrarReserva, actualizarReserva } from '../servicios/servicio-reservas'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { Reserva, SolicitudRegistrarReserva } from '../contratos/tipos'

interface PropsModalReserva {
  abierto: boolean
  alCerrar: () => void
  /** Si viene una reserva, el modal opera en modo edición; si no, crea una nueva. */
  reserva?: Reserva | null
}

// Único modal de reserva: crear y editar comparten el mismo FormularioReserva
// (antes el editar reimplementaba el formulario inline → duplicación).
export function ModalReserva({ abierto, alCerrar, reserva }: PropsModalReserva) {
  const clienteConsulta = useQueryClient()
  const modoEdicion = !!reserva

  const mutacion = useMutation({
    mutationFn: async (s: SolicitudRegistrarReserva): Promise<void> => {
      if (modoEdicion) {
        await actualizarReserva(reserva!.id, {
          cliente_id: s.cliente_id,
          barbero_id: s.barbero_id,
          servicio_id: s.servicio_id,
          fecha_hora_inicio: s.fecha_hora_inicio,
          origen: s.origen,
        })
      } else {
        await registrarReserva(s)
      }
    },
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['reservas'] })
      toast.success(modoEdicion ? 'Reserva actualizada' : 'Reserva registrada correctamente')
      alCerrar()
    },
    onError: () =>
      toast.error(modoEdicion ? 'No se pudo actualizar la reserva' : 'No se pudo registrar la reserva'),
  })

  const valoresIniciales = reserva
    ? {
        cliente_id: reserva.cliente_id,
        barbero_id: reserva.barbero_id,
        sucursal_id: reserva.sucursal_id ?? '',
        fecha_hora_inicio: reserva.fecha_hora_inicio.slice(0, 16),
        origen: reserva.origen,
      }
    : undefined

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={modoEdicion ? 'Editar reserva' : 'Nueva reserva'}
      descripcion={
        modoEdicion
          ? 'Modifica los datos de la reserva. Solo disponible para reservas pendientes o confirmadas.'
          : 'Registra una cita para un cliente.'
      }
      ancho="md"
    >
      {abierto && (
        <FormularioReserva
          key={reserva?.id ?? 'nueva'}
          valoresIniciales={valoresIniciales}
          textoEnviar={modoEdicion ? 'Guardar cambios' : 'Registrar reserva'}
          onSubmit={(s) => mutacion.mutate(s)}
          enviando={mutacion.isPending}
          error={mutacion.error ? mensajeDeError(mutacion.error) : null}
        />
      )}
    </Modal>
  )
}
