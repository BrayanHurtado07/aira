import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarRecordatorios, programarRecordatorio, cancelarRecordatorio } from '../servicios/servicio-notificaciones'
import type { SolicitudProgramarRecordatorio } from '../contratos/tipos'

export function usarListaRecordatorios() {
  const consulta = useQuery({
    queryKey: ['recordatorios'],
    queryFn: () => listarRecordatorios(),
  })
  return {
    recordatorios: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarRecordatorios() {
  const clienteConsulta = useQueryClient()

  const mutacionProgramar = useMutation({
    mutationFn: (solicitud: SolicitudProgramarRecordatorio) => programarRecordatorio(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['recordatorios'] })
    },
  })

  const mutacionCancelar = useMutation({
    mutationFn: (id: string) => cancelarRecordatorio(id),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['recordatorios'] })
    },
  })

  return {
    programar: mutacionProgramar.mutate,
    cancelar: mutacionCancelar.mutate,
    ejecutando: mutacionProgramar.isPending || mutacionCancelar.isPending,
    error: mutacionProgramar.error ?? mutacionCancelar.error,
    estadoProgramar: {
      exitoso: mutacionProgramar.isSuccess,
      ejecutando: mutacionProgramar.isPending,
      error: mutacionProgramar.error,
    },
    estadoCancelar: {
      exitoso: mutacionCancelar.isSuccess,
      ejecutando: mutacionCancelar.isPending,
      error: mutacionCancelar.error,
    },
  }
}
