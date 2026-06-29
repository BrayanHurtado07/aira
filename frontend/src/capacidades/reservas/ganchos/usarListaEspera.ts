import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ingresarListaEspera, listarListaEspera, promoverListaEspera } from '../servicios/servicio-reservas'
import type { SolicitudIngresarListaEspera } from '../contratos/tipos'

export function usarListaEspera() {
  const consulta = useQuery({
    queryKey: ['lista-espera'],
    queryFn: () => listarListaEspera(),
  })
  return {
    listaEspera: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarIngresarListaEspera() {
  const clienteConsulta = useQueryClient()
  return useMutation({
    mutationFn: (solicitud: SolicitudIngresarListaEspera) => ingresarListaEspera(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['lista-espera'] })
    },
  })
}

export function usarPromoverListaEspera() {
  const clienteConsulta = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => promoverListaEspera(id),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['lista-espera'] })
    },
  })
}
