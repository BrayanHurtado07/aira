import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { obtenerBarberos, registrarBarbero } from '@/capacidades/agenda/servicios/servicio-agenda'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { SolicitudRegistrarBarbero } from '@/capacidades/agenda/contratos/tipos'

export function usarBarberos() {
  const clienteConsulta = useQueryClient()

  const consulta = useQuery({
    queryKey: ['barberos'],
    queryFn: () => obtenerBarberos(),
  })

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudRegistrarBarbero) => registrarBarbero(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['barberos'] })
    },
  })

  return {
    barberos: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error ? mensajeDeError(consulta.error) : null,
    registrar: mutacion.mutateAsync,
    registrando: mutacion.isPending,
  }
}
