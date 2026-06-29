import { clienteHttp } from '@/integraciones/http/cliente'
import type {
  Cliente,
  Reserva,
  SolicitudRegistrarReserva,
  SolicitudRegistrarCliente,
  SolicitudActualizarCliente,
  EntradaListaEspera,
  SolicitudIngresarListaEspera,
  ComplementoReservaItem,
  SolicitudAgregarComplemento,
} from '@/capacidades/reservas/contratos/tipos'

export const obtenerReservas = () =>
  clienteHttp.get<Reserva[]>('/reservas')

export const registrarReserva = (solicitud: SolicitudRegistrarReserva) =>
  clienteHttp.post<Reserva>('/reservas', solicitud)

export const confirmarReserva = (id: string) =>
  clienteHttp.post<Reserva>(`/reservas/${id}/confirmar`)

export const cancelarReserva = (id: string) =>
  clienteHttp.post<Reserva>(`/reservas/${id}/cancelar`)

export const completarReserva = (id: string) =>
  clienteHttp.post<Reserva>(`/reservas/${id}/completar`)

export const marcarNoAsistioReserva = (id: string) =>
  clienteHttp.post<Reserva>(`/reservas/${id}/no-asistio`)

export const obtenerClientes = () =>
  clienteHttp.get<Cliente[]>('/clientes')

export const registrarCliente = (solicitud: SolicitudRegistrarCliente) =>
  clienteHttp.post<{ cliente_id: string; ya_existia: boolean }>(
    '/clientes',
    solicitud,
  )

export const actualizarReserva = (
  reservaId: string,
  solicitud: import('@/capacidades/reservas/contratos/tipos').SolicitudActualizarReserva,
) => clienteHttp.patch<void>(`/reservas/${reservaId}`, solicitud)

export const actualizarCliente = (
  clienteId: string,
  solicitud: SolicitudActualizarCliente,
) => clienteHttp.patch<void>(`/clientes/${clienteId}`, solicitud)

export const cambiarEstadoCliente = (
  clienteId: string,
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO',
) => clienteHttp.patch<void>(`/clientes/${clienteId}/estado`, { estado })

export const ingresarListaEspera = (
  solicitud: SolicitudIngresarListaEspera,
): Promise<{ lista_espera_id: string }> =>
  clienteHttp.post<{ lista_espera_id: string }>('/lista-espera', solicitud)

export const listarListaEspera = (): Promise<EntradaListaEspera[]> =>
  clienteHttp.get<EntradaListaEspera[]>('/lista-espera')

export const promoverListaEspera = (id: string) =>
  clienteHttp.post<void>(`/lista-espera/${id}/promover`)

export const agregarComplemento = (
  reservaID: string,
  solicitud: SolicitudAgregarComplemento,
): Promise<void> =>
  clienteHttp.post<void>(`/reservas/${reservaID}/complementos`, solicitud)

export const listarComplementos = (
  reservaID: string,
): Promise<ComplementoReservaItem[]> =>
  clienteHttp.get<ComplementoReservaItem[]>(`/reservas/${reservaID}/complementos`)
