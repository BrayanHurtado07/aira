import { clienteHttp } from '@/integraciones/http/cliente'
import type {
  Campana,
  SolicitudCrearCampana,
  RespuestaCrearCampana,
  RespuestaCargarInactivos,
  RespuestaDespachar,
} from '../contratos/tipos'

export const listarCampanias = (): Promise<Campana[]> =>
  clienteHttp.get<Campana[]>('/campanias')

export const crearCampania = (
  solicitud: SolicitudCrearCampana,
): Promise<RespuestaCrearCampana> =>
  clienteHttp.post<RespuestaCrearCampana>('/campanias', solicitud)

export const cargarInactivos = (
  campanaId: string,
  dias: number,
): Promise<RespuestaCargarInactivos> =>
  clienteHttp.post<RespuestaCargarInactivos>(
    `/campanias/${campanaId}/destinatarios/inactivos`,
    { dias },
  )

export const despacharCampania = (
  campanaId: string,
): Promise<RespuestaDespachar> =>
  clienteHttp.post<RespuestaDespachar>(`/campanias/${campanaId}/despachar`)
