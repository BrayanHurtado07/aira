export type EstadoRecordatorio = 'PENDIENTE' | 'ENVIADO' | 'FALLIDO' | 'CANCELADO'

export type CanalRecordatorio = 'WHATSAPP' | 'EMAIL' | 'SMS'

export type Recordatorio = {
  id: string
  reserva_id: string
  enviar_en: string
  canal: CanalRecordatorio
  estado: EstadoRecordatorio
}

export type RecordatorioResumen = {
  id: string
  reserva_id: string
  nombre_cliente: string
  fecha_reserva: string
  enviar_en: string
  canal: CanalRecordatorio
  estado: EstadoRecordatorio
  creado_en: string
}

export type SolicitudProgramarRecordatorio = {
  reserva_id: string
  enviar_en: string
  canal: CanalRecordatorio
}

export type CanalPlantilla = 'WHATSAPP' | 'EMAIL'
export type EstadoPlantilla = 'ACTIVO' | 'INACTIVO'

export type PlantillaMensaje = {
  id: string
  empresa_id: string
  nombre: string
  canal: CanalPlantilla
  contenido_plantilla: string
  estado: EstadoPlantilla
}

export type SolicitudCrearPlantilla = {
  nombre: string
  canal: CanalPlantilla
  contenido_plantilla: string
}
