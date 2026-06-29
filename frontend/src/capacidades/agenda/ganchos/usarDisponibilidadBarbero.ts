import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { registrarDisponibilidad, obtenerDisponibilidadBarbero, eliminarDisponibilidad } from '@/capacidades/agenda/servicios/servicio-agenda'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { SolicitudRegistrarDisponibilidad } from '@/capacidades/agenda/contratos/tipos'

export function usarDisponibilidadBarbero(barberoId?: string) {
  const clienteConsulta = useQueryClient()

  const consulta = useQuery({
    queryKey: ['disponibilidad', barberoId],
    queryFn: () => obtenerDisponibilidadBarbero(barberoId!),
    enabled: !!barberoId,
  })

  const invalidar = () =>
    clienteConsulta.invalidateQueries({ queryKey: ['disponibilidad', barberoId] })

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudRegistrarDisponibilidad) =>
      registrarDisponibilidad(solicitud),
    onSuccess: (_, solicitud) => {
      clienteConsulta.invalidateQueries({ queryKey: ['disponibilidad', solicitud.barbero_id] })
    },
  })

  const mutacionEliminar = useMutation({
    mutationFn: (bloqueId: string) => eliminarDisponibilidad(barberoId!, bloqueId),
    onSuccess: invalidar,
  })

  const registrar = async (solicitud: SolicitudRegistrarDisponibilidad) => {
    await mutacion.mutateAsync(solicitud)
  }

  const eliminar = async (bloqueId: string) => {
    await mutacionEliminar.mutateAsync(bloqueId)
  }

  return {
    bloques: consulta.data ?? [],
    cargandoBloques: consulta.isLoading,
    errorCarga: consulta.error ? mensajeDeError(consulta.error) : null,
    registrar,
    registrando: mutacion.isPending,
    eliminar,
    eliminando: mutacionEliminar.isPending,
    error: mutacion.error ? mensajeDeError(mutacion.error) : null,
  }
}
