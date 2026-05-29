import { useQuery } from '@tanstack/react-query'
import { obtenerConversaciones } from '../servicios/servicio-canal-whatsapp'
import type { Conversacion } from '../contratos/tipos'

export function usarConversaciones() {
  const { data, isLoading, error } = useQuery<Conversacion[]>({
    queryKey: ['conversaciones'],
    queryFn: obtenerConversaciones,
  })

  return {
    conversaciones: data ?? [],
    cargando: isLoading,
    error,
  }
}
