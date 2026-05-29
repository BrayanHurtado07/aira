import { clienteHttp } from '@/integraciones/http/cliente'
import type { Conversacion, Mensaje, SolicitudRegistrarMensaje } from '../contratos/tipos'

export async function obtenerConversaciones(): Promise<Conversacion[]> {
  return clienteHttp.get<Conversacion[]>('/conversaciones')
}

export async function obtenerMensajes(conversacionId: string): Promise<Mensaje[]> {
  return clienteHttp.get<Mensaje[]>(`/mensajes?conversacion_id=${conversacionId}`)
}

export async function registrarMensaje(solicitud: SolicitudRegistrarMensaje): Promise<Mensaje> {
  return clienteHttp.post<Mensaje>('/mensajes', solicitud)
}
