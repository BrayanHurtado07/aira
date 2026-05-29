import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { obtenerClientes, registrarCliente } from '@/capacidades/reservas/servicios/servicio-reservas'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { SolicitudRegistrarCliente } from '@/capacidades/reservas/contratos/tipos'

export function usarClientes() {
  const clienteConsulta = useQueryClient()

  const consulta = useQuery({
    queryKey: ['clientes'],
    queryFn: () => obtenerClientes(),
  })

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudRegistrarCliente) => registrarCliente(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['clientes'] })
    },
  })

  return {
    clientes: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error ? mensajeDeError(consulta.error) : null,
    registrar: mutacion.mutateAsync,
    registrando: mutacion.isPending,
  }
}
