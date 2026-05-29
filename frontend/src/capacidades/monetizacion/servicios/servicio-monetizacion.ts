import { clienteHttp } from '@/integraciones/http/cliente'
import type { PlanResumen, Suscripcion, SolicitudActivarSuscripcion, SuscripcionResumen } from '../contratos/tipos'

export const listarSuscripciones = (): Promise<SuscripcionResumen[]> =>
  clienteHttp.get<SuscripcionResumen[]>('/suscripciones')

export const listarPlanes = (): Promise<PlanResumen[]> =>
  clienteHttp.get<PlanResumen[]>('/planes')

export async function activarSuscripcion(solicitud: SolicitudActivarSuscripcion): Promise<Suscripcion> {
  return clienteHttp.post<Suscripcion>('/suscripciones', solicitud)
}

export async function suspenderSuscripcion(id: string): Promise<void> {
  return clienteHttp.post<void>(`/suscripciones/${id}/suspender`)
}

export async function cancelarSuscripcion(id: string): Promise<void> {
  return clienteHttp.post<void>(`/suscripciones/${id}/cancelar`)
}
