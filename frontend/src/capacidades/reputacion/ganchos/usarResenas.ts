import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarResenas, moderarResena, publicarResena } from '../servicios/servicio-reputacion'
import type { EstadoResena } from '../contratos/tipos'

const CLAVE_BASE = 'reputacion'

// usarResenas lista las reseñas de la empresa, filtradas opcionalmente por estado.
export function usarResenas(estado: EstadoResena | '') {
  const consulta = useQuery({
    queryKey: [CLAVE_BASE, 'resenas', estado || 'todas'],
    queryFn: () => listarResenas(estado),
  })
  return {
    resenas: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

// usarModeracionResena agrupa las acciones de publicar y moderar una reseña.
export function usarModeracionResena() {
  const clienteConsulta = useQueryClient()

  const invalidar = () => {
    clienteConsulta.invalidateQueries({ queryKey: [CLAVE_BASE, 'resenas'] })
  }

  const mutacionPublicar = useMutation({
    mutationFn: (resenaId: string) => publicarResena(resenaId),
    onSuccess: invalidar,
  })

  const mutacionModerar = useMutation({
    mutationFn: (resenaId: string) => moderarResena(resenaId),
    onSuccess: invalidar,
  })

  return {
    publicar: mutacionPublicar.mutate,
    moderar: mutacionModerar.mutate,
    publicando: mutacionPublicar.isPending,
    moderando: mutacionModerar.isPending,
    ejecutando: mutacionPublicar.isPending || mutacionModerar.isPending,
    error: mutacionPublicar.error ?? mutacionModerar.error,
  }
}
