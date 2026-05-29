import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listarSuscripciones,
  listarPlanes,
  activarSuscripcion,
  suspenderSuscripcion,
  cancelarSuscripcion,
} from '../servicios/servicio-monetizacion'
import type { SolicitudActivarSuscripcion } from '../contratos/tipos'

export function usarSuscripcion() {
  const clienteConsulta = useQueryClient()

  const consultaSuscripciones = useQuery({
    queryKey: ['suscripciones'],
    queryFn: () => listarSuscripciones(),
  })

  const consultaPlanes = useQuery({
    queryKey: ['planes'],
    queryFn: () => listarPlanes(),
  })

  const mutacionActivar = useMutation({
    mutationFn: (solicitud: SolicitudActivarSuscripcion) => activarSuscripcion(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['suscripciones'] })
    },
  })

  const mutacionSuspender = useMutation({
    mutationFn: (id: string) => suspenderSuscripcion(id),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['suscripciones'] })
    },
  })

  const mutacionCancelar = useMutation({
    mutationFn: (id: string) => cancelarSuscripcion(id),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['suscripciones'] })
    },
  })

  return {
    suscripciones: consultaSuscripciones.data ?? [],
    planes:        consultaPlanes.data ?? [],
    cargando:      consultaSuscripciones.isLoading,
    activar:       mutacionActivar.mutate,
    suspender:     mutacionSuspender.mutate,
    cancelar:      mutacionCancelar.mutate,
    estadoActivar: {
      exitoso:    mutacionActivar.isSuccess,
      ejecutando: mutacionActivar.isPending,
      error:      mutacionActivar.error,
    },
    estadoSuspender: {
      exitoso:    mutacionSuspender.isSuccess,
      ejecutando: mutacionSuspender.isPending,
      error:      mutacionSuspender.error,
    },
    estadoCancelar: {
      exitoso:    mutacionCancelar.isSuccess,
      ejecutando: mutacionCancelar.isPending,
      error:      mutacionCancelar.error,
    },
  }
}
