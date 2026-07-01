import { clienteHttp } from '@/integraciones/http/cliente'
import type { Conversacion, Mensaje, SolicitudRegistrarMensaje, Atajo, SolicitudCrearAtajo } from '../contratos/tipos'

export async function obtenerConversaciones(): Promise<Conversacion[]> {
  return clienteHttp.get<Conversacion[]>('/conversaciones')
}

export async function obtenerMensajes(conversacionId: string): Promise<Mensaje[]> {
  return clienteHttp.get<Mensaje[]>(`/mensajes?conversacion_id=${conversacionId}`)
}

export async function registrarMensaje(solicitud: SolicitudRegistrarMensaje): Promise<Mensaje> {
  return clienteHttp.post<Mensaje>('/mensajes', solicitud)
}

export async function listarAtajos(): Promise<Atajo[]> {
  return clienteHttp.get<Atajo[]>('/atajos')
}

export async function crearAtajo(solicitud: SolicitudCrearAtajo): Promise<{ atajo_id: string }> {
  return clienteHttp.post<{ atajo_id: string }>('/atajos', solicitud)
}

export async function eliminarAtajo(atajoId: string): Promise<void> {
  return clienteHttp.delete<void>(`/atajos/${atajoId}`)
}
