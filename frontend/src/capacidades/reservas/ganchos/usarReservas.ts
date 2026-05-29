import { useQuery } from '@tanstack/react-query'
import { obtenerReservas } from '@/capacidades/reservas/servicios/servicio-reservas'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'

export function usarReservas() {
  const consulta = useQuery({
    queryKey: ['reservas'],
    queryFn: () => obtenerReservas(),
  })

  return {
    reservas: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error ? mensajeDeError(consulta.error) : null,
  }
}
