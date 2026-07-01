import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarAtajos, crearAtajo, eliminarAtajo } from '../servicios/servicio-canal-whatsapp'
import type { Atajo, SolicitudCrearAtajo } from '../contratos/tipos'

// Atajos de respuesta rápida de la empresa. Compartidos por toda la bandeja.
export function usarAtajos() {
  const clienteConsulta = useQueryClient()

  const consulta = useQuery<Atajo[]>({
    queryKey: ['atajos'],
    queryFn: listarAtajos,
  })

  const invalidar = () => clienteConsulta.invalidateQueries({ queryKey: ['atajos'] })

  const mutacionCrear = useMutation({
    mutationFn: (s: SolicitudCrearAtajo) => crearAtajo(s),
    onSuccess: invalidar,
  })

  const mutacionEliminar = useMutation({
    mutationFn: (atajoId: string) => eliminarAtajo(atajoId),
    onSuccess: invalidar,
  })

  return {
    atajos: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
    crear: mutacionCrear.mutate,
    creando: mutacionCrear.isPending,
    eliminar: mutacionEliminar.mutate,
    eliminando: mutacionEliminar.isPending,
  }
}
