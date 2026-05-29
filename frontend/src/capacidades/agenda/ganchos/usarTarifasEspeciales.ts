import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listarTarifasSucursal,
  crearTarifaEspecial,
  eliminarTarifaEspecial,
} from '../servicios/servicio-agenda'
import type { SolicitudCrearTarifa } from '../contratos/tipos'

export function usarTarifasSucursal(sucursalID: string) {
  const consulta = useQuery({
    queryKey: ['tarifas', sucursalID],
    queryFn: () => listarTarifasSucursal(sucursalID),
    enabled: !!sucursalID,
  })
  return {
    tarifas: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarCrearTarifa(sucursalID: string) {
  const clienteConsulta = useQueryClient()
  return useMutation({
    mutationFn: (solicitud: SolicitudCrearTarifa) =>
      crearTarifaEspecial(sucursalID, solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['tarifas', sucursalID] })
    },
  })
}

export function usarEliminarTarifa(sucursalID: string) {
  const clienteConsulta = useQueryClient()
  return useMutation({
    mutationFn: (tarifaID: string) => eliminarTarifaEspecial(tarifaID),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['tarifas', sucursalID] })
    },
  })
}
