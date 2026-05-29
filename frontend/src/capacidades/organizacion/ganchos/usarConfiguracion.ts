import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { obtenerConfiguracion, guardarConfiguracion } from '../servicios/servicio-organizacion'
import type { SolicitudGuardarConfiguracion } from '../contratos/tipos'

export function usarConfiguracion() {
  const clienteConsulta = useQueryClient()

  const consulta = useQuery({
    queryKey: ['organizacion', 'configuracion'],
    queryFn: obtenerConfiguracion,
    retry: false,
  })

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudGuardarConfiguracion) => guardarConfiguracion(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['organizacion', 'configuracion'] })
    },
  })

  return {
    configuracion: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: consulta.error,
    guardar: mutacion.mutate,
    guardando: mutacion.isPending,
    guardadoExitoso: mutacion.isSuccess,
    errorGuardar: mutacion.error,
  }
}
