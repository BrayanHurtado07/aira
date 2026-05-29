import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { registrarDisponibilidad, obtenerDisponibilidadBarbero } from '@/capacidades/agenda/servicios/servicio-agenda'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { SolicitudRegistrarDisponibilidad } from '@/capacidades/agenda/contratos/tipos'

export function usarDisponibilidadBarbero(barberoId?: string) {
  const clienteConsulta = useQueryClient()

  const consulta = useQuery({
    queryKey: ['disponibilidad', barberoId],
    queryFn: () => obtenerDisponibilidadBarbero(barberoId!),
    enabled: !!barberoId,
  })

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudRegistrarDisponibilidad) =>
      registrarDisponibilidad(solicitud),
    onSuccess: (_, solicitud) => {
      clienteConsulta.invalidateQueries({ queryKey: ['disponibilidad', solicitud.barbero_id] })
    },
  })

  const registrar = async (solicitud: SolicitudRegistrarDisponibilidad) => {
    await mutacion.mutateAsync(solicitud)
  }

  return {
    bloques: consulta.data ?? [],
    cargandoBloques: consulta.isLoading,
    registrar,
    registrando: mutacion.isPending,
    error: mutacion.error ? mensajeDeError(mutacion.error) : null,
  }
}
