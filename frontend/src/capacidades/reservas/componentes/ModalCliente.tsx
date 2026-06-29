import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Save } from 'lucide-react'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { FormularioCliente, type DatosCliente } from './FormularioCliente'
import { registrarCliente, actualizarCliente } from '../servicios/servicio-reservas'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { Cliente } from '../contratos/tipos'

interface PropsModalCliente {
  abierto: boolean
  alCerrar: () => void
  /** Si viene un cliente, el modal edita; si no, crea uno nuevo. */
  cliente?: Cliente | null
}

// Único modal de cliente: crear y editar comparten FormularioCliente.
export function ModalCliente({ abierto, alCerrar, cliente }: PropsModalCliente) {
  const clienteConsulta = useQueryClient()
  const modoEdicion = !!cliente

  const mutacion = useMutation({
    mutationFn: async (d: DatosCliente): Promise<void> => {
      const payload = {
        nombre: d.nombre,
        telefono: d.telefono,
        ...(d.correo ? { correo_electronico: d.correo } : {}),
      }
      if (modoEdicion) await actualizarCliente(cliente!.id, payload)
      else await registrarCliente(payload)
    },
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['clientes'] })
      toast.success(modoEdicion ? 'Cliente actualizado' : 'Cliente registrado')
      alCerrar()
    },
    onError: () =>
      toast.error(modoEdicion ? 'No se pudo actualizar el cliente' : 'No se pudo registrar el cliente'),
  })

  const valoresIniciales = cliente
    ? { nombre: cliente.nombre, telefono: cliente.telefono, correo: cliente.correo ?? '' }
    : undefined

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={modoEdicion ? 'Editar cliente' : 'Nuevo cliente'}
      descripcion={modoEdicion ? `Modifica los datos de ${cliente!.nombre}` : 'Registra un cliente de la barbería.'}
      ancho="sm"
      sinCerrarAlFondo={mutacion.isPending}
    >
      {abierto && (
        <FormularioCliente
          key={cliente?.id ?? 'nuevo'}
          valoresIniciales={valoresIniciales}
          textoEnviar={modoEdicion ? 'Guardar cambios' : 'Registrar cliente'}
          iconoEnviar={modoEdicion ? <Save size={14} /> : <UserPlus size={14} />}
          onSubmit={(d) => mutacion.mutate(d)}
          enviando={mutacion.isPending}
          error={mutacion.error ? mensajeDeError(mutacion.error) : null}
        />
      )}
    </Modal>
  )
}
