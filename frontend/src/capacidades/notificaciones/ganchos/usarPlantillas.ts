import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarPlantillas, crearPlantilla } from '../servicios/servicio-notificaciones'
import type { SolicitudCrearPlantilla } from '../contratos/tipos'

export function usarPlantillas() {
  const consulta = useQuery({
    queryKey: ['plantillas'],
    queryFn: () => listarPlantillas(),
  })
  return {
    plantillas: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarCrearPlantilla() {
  const clienteConsulta = useQueryClient()
  return useMutation({
    mutationFn: (solicitud: SolicitudCrearPlantilla) => crearPlantilla(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['plantillas'] })
    },
  })
}
