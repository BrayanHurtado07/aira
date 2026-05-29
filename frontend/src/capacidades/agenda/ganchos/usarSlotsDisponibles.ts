import { useQuery } from '@tanstack/react-query'
import { consultarSlotsDisponibles } from '@/capacidades/agenda/servicios/servicio-agenda'

export function usarSlotsDisponibles(barberoId: string, servicioId: string, fecha: string) {
  const consulta = useQuery({
    queryKey: ['slots', barberoId, servicioId, fecha],
    queryFn: () => consultarSlotsDisponibles(barberoId, servicioId, fecha),
    enabled: !!barberoId && !!servicioId && !!fecha,
    staleTime: 30_000, // 30 s — los slots cambian poco
  })

  return {
    slots: consulta.data?.slots ?? [],
    duracion: consulta.data?.duracion_minutos ?? 0,
    sucursalId: consulta.data?.sucursal_id ?? '',
    cargando: consulta.isLoading,
    sinHorarios: !consulta.isLoading && (consulta.data?.slots?.length ?? 0) === 0,
  }
}
