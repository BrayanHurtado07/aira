import { clienteHttp } from '@/integraciones/http/cliente'
import type { Sello, SelloActivo, SolicitudAcumularSello, SolicitudAplicarCanje, SolicitudCrearProgramaLealtad, TarjetaLealtad, ProgramaLealtad } from '../contratos/tipos'

export async function acumularSello(solicitud: SolicitudAcumularSello): Promise<Sello> {
  return clienteHttp.post<Sello>('/sellos', solicitud)
}

export async function anularSello(selloId: string, motivo: string): Promise<Sello> {
  return clienteHttp.post<Sello>(`/sellos/${selloId}/anular`, { motivo_anulacion: motivo })
}

export async function aplicarCanje(solicitud: SolicitudAplicarCanje): Promise<void> {
  return clienteHttp.post<void>('/canjes', solicitud)
}

export const crearPrograma = (solicitud: SolicitudCrearProgramaLealtad): Promise<{ ProgramaID: string }> =>
  clienteHttp.post<{ ProgramaID: string }>('/lealtad/programa', solicitud)

export const obtenerPrograma = (): Promise<ProgramaLealtad> =>
  clienteHttp.get<ProgramaLealtad>('/lealtad/programa')

export const obtenerTarjetas = (): Promise<TarjetaLealtad[]> =>
  clienteHttp.get<TarjetaLealtad[]>('/lealtad/tarjetas')

export const obtenerTarjetaCliente = (clienteId: string): Promise<TarjetaLealtad> =>
  clienteHttp.get<TarjetaLealtad>(`/lealtad/tarjetas/${clienteId}`)

export const listarSellosCliente = (clienteId: string): Promise<SelloActivo[]> =>
  clienteHttp.get<SelloActivo[]>(`/lealtad/clientes/${clienteId}/sellos`)
