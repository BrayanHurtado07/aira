import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { agregarComplemento, listarComplementos } from '../servicios/servicio-reservas'
import type { SolicitudAgregarComplemento } from '../contratos/tipos'

export function usarComplementosReserva(reservaID: string) {
  const consulta = useQuery({
    queryKey: ['complementos', reservaID],
    queryFn: () => listarComplementos(reservaID),
    enabled: !!reservaID,
  })
  return {
    complementos: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarAgregarComplemento(reservaID: string) {
  const clienteConsulta = useQueryClient()
  return useMutation({
    mutationFn: (solicitud: SolicitudAgregarComplemento) =>
      agregarComplemento(reservaID, solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['complementos', reservaID] })
    },
  })
}
