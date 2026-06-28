import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listarCampanias,
  crearCampania,
  cargarInactivos,
  despacharCampania,
} from '../servicios/servicio-campanias'
import type { SolicitudCrearCampana } from '../contratos/tipos'

export function usarCampanias() {
  const consulta = useQuery({
    queryKey: ['campanias'],
    queryFn: () => listarCampanias(),
  })
  return {
    campanias: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarCrearCampania() {
  const clienteConsulta = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudCrearCampana) => crearCampania(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['campanias'] })
    },
  })
  return {
    crear: mutacion.mutate,
    ejecutando: mutacion.isPending,
    error: mutacion.error,
  }
}

export function usarSegmentarInactivos() {
  const clienteConsulta = useQueryClient()
  const mutacion = useMutation({
    mutationFn: ({ campanaId, dias }: { campanaId: string; dias: number }) =>
      cargarInactivos(campanaId, dias),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['campanias'] })
    },
  })
  return {
    segmentar: mutacion.mutate,
    ejecutando: mutacion.isPending,
    error: mutacion.error,
  }
}

export function usarDespacharCampania() {
  const clienteConsulta = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (campanaId: string) => despacharCampania(campanaId),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['campanias'] })
    },
  })
  return {
    despachar: mutacion.mutate,
    ejecutando: mutacion.isPending,
    error: mutacion.error,
  }
}
