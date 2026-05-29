import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  registrarExcepcionDisponibilidad,
  listarExcepcionesBarbero,
  eliminarExcepcionDisponibilidad,
} from '@/capacidades/agenda/servicios/servicio-agenda'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { SolicitudRegistrarExcepcion } from '@/capacidades/agenda/contratos/tipos'

export function usarExcepcionesBarbero(barberoId?: string) {
  const clienteConsulta = useQueryClient()

  const consulta = useQuery({
    queryKey: ['excepciones', barberoId],
    queryFn: () => listarExcepcionesBarbero(barberoId!),
    enabled: !!barberoId,
  })

  const mutacionRegistrar = useMutation({
    mutationFn: (solicitud: SolicitudRegistrarExcepcion) =>
      registrarExcepcionDisponibilidad(barberoId!, solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['excepciones', barberoId] })
    },
  })

  const mutacionEliminar = useMutation({
    mutationFn: (excepcionId: string) =>
      eliminarExcepcionDisponibilidad(barberoId!, excepcionId),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['excepciones', barberoId] })
    },
  })

  const registrar = async (solicitud: SolicitudRegistrarExcepcion) => {
    await mutacionRegistrar.mutateAsync(solicitud)
  }

  const eliminar = async (excepcionId: string) => {
    await mutacionEliminar.mutateAsync(excepcionId)
  }

  return {
    excepciones: consulta.data ?? [],
    cargandoExcepciones: consulta.isLoading,
    registrar,
    registrando: mutacionRegistrar.isPending,
    eliminar,
    eliminando: mutacionEliminar.isPending,
    errorRegistrar: mutacionRegistrar.error ? mensajeDeError(mutacionRegistrar.error) : null,
    errorEliminar: mutacionEliminar.error ? mensajeDeError(mutacionEliminar.error) : null,
  }
}
