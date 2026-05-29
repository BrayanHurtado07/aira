import { useQuery } from '@tanstack/react-query'
import { obtenerServiciosBarbero } from '@/capacidades/agenda/servicios/servicio-agenda'

export function usarServiciosBarbero(barberoId?: string) {
  const consulta = useQuery({
    queryKey: ['servicios-barbero', barberoId],
    queryFn: () => obtenerServiciosBarbero(barberoId!),
    enabled: !!barberoId,
  })

  return {
    servicios: consulta.data ?? [],
    cargando: consulta.isLoading,
  }
}
