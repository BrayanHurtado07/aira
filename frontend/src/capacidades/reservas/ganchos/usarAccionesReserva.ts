import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  confirmarReserva,
  cancelarReserva,
  completarReserva,
  marcarNoAsistioReserva,
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

  const mutacionNoAsistio = useMutation({
    mutationFn: (id: string) => marcarNoAsistioReserva(id),
    onSuccess: invalidarReservas,
  })

  return {
    confirmar: (id: string) => mutacionConfirmar.mutateAsync(id),
    cancelar: (id: string) => mutacionCancelar.mutateAsync(id),
    completar: (id: string) => mutacionCompletar.mutateAsync(id),
    marcarNoAsistio: (id: string) => mutacionNoAsistio.mutateAsync(id),
    ejecutando:
      mutacionConfirmar.isPending ||
      mutacionCancelar.isPending ||
      mutacionCompletar.isPending ||
      mutacionNoAsistio.isPending,
  }
}
