import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Save } from 'lucide-react'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { FormularioServicio, type DatosServicio } from './FormularioServicio'
import { crearServicio, actualizarServicio } from '../servicios/servicio-agenda'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { Servicio } from '@/capacidades/agenda/contratos/tipos'

interface PropsModalServicio {
  abierto: boolean
  alCerrar: () => void
  /** Si viene un servicio, edita; si no, crea uno nuevo. */
  servicio?: Servicio | null
}

// Único modal de servicio: crear y editar comparten FormularioServicio.
export function ModalServicio({ abierto, alCerrar, servicio }: PropsModalServicio) {
  const clienteConsulta = useQueryClient()
  const modoEdicion = !!servicio

  const mutacion = useMutation({
    mutationFn: async (d: DatosServicio): Promise<void> => {
      if (modoEdicion) await actualizarServicio(servicio!.id, d)
      else await crearServicio(d)
    },
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['servicios'] })
      toast.success(modoEdicion ? 'Servicio actualizado' : 'Servicio creado')
      alCerrar()
    },
    onError: () => toast.error(modoEdicion ? 'No se pudo actualizar el servicio' : 'No se pudo crear el servicio'),
  })

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={modoEdicion ? 'Editar servicio' : 'Nuevo servicio'}
      descripcion={modoEdicion ? 'Actualiza el nombre, duración y precio.' : 'Crea un servicio que ofrece la barbería.'}
      ancho="sm"
      sinCerrarAlFondo={mutacion.isPending}
    >
      {abierto && (
        <FormularioServicio
          key={servicio?.id ?? 'nuevo'}
          valoresIniciales={servicio ? { nombre: servicio.nombre, duracion_minutos: servicio.duracion_minutos, precio: servicio.precio } : undefined}
          textoEnviar={modoEdicion ? 'Guardar cambios' : 'Crear servicio'}
          iconoEnviar={modoEdicion ? <Save size={14} /> : <Plus size={14} />}
          onSubmit={(d) => mutacion.mutate(d)}
          enviando={mutacion.isPending}
          error={mutacion.error ? mensajeDeError(mutacion.error) : null}
        />
      )}
    </Modal>
  )
}
