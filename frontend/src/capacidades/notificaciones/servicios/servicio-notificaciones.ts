import { clienteHttp } from '@/integraciones/http/cliente'
import type {
  Recordatorio,
  RecordatorioResumen,
  SolicitudProgramarRecordatorio,
  PlantillaMensaje,
  SolicitudCrearPlantilla,
} from '../contratos/tipos'

export const listarRecordatorios = (): Promise<RecordatorioResumen[]> =>
  clienteHttp.get<RecordatorioResumen[]>('/recordatorios')

export async function programarRecordatorio(solicitud: SolicitudProgramarRecordatorio): Promise<Recordatorio> {
  return clienteHttp.post<Recordatorio>('/recordatorios', solicitud)
}

export async function cancelarRecordatorio(id: string): Promise<void> {
  return clienteHttp.post<void>(`/recordatorios/${id}/cancelar`)
}

export const listarPlantillas = (): Promise<PlantillaMensaje[]> =>
  clienteHttp.get<PlantillaMensaje[]>('/plantillas')

export const crearPlantilla = (
  solicitud: SolicitudCrearPlantilla,
): Promise<{ plantilla_id: string }> =>
  clienteHttp.post<{ plantilla_id: string }>('/plantillas', solicitud)
