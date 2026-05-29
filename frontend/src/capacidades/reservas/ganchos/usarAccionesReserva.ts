import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  confirmarReserva,
  cancelarReserva,
  completarReserva,
} from '@/capacidades/reservas/servicios/servicio-reservas'

export function usarAccionesReserva() {
  const clienteConsulta = useQueryClient()

  const invalidarReservas = () =>
    clienteConsulta.invalidateQueries({ queryKey: ['reservas'] })

  const mutacionConfirmar = useMutation({
    mutationFn: (id: string) => confirmarReserva(id),
    onSuccess: invalidarReservas,
  })

  const mutacionCancelar = useMutation({
    mutationFn: (id: string) => cancelarReserva(id),
    onSuccess: invalidarReservas,
  })

  const mutacionCompletar = useMutation({
    mutationFn: (id: string) => completarReserva(id),
    onSuccess: invalidarReservas,
  })

  return {
    confirmar: (id: string) => mutacionConfirmar.mutateAsync(id),
    cancelar: (id: string) => mutacionCancelar.mutateAsync(id),
    completar: (id: string) => mutacionCompletar.mutateAsync(id),
    ejecutando:
      mutacionConfirmar.isPending ||
      mutacionCancelar.isPending ||
      mutacionCompletar.isPending,
  }
}
