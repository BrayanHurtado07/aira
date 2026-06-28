export type EstadoCampana = 'BORRADOR' | 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'

export type TipoCampana = 'MANUAL' | 'INACTIVOS' | 'PROMOCION'

export type Campana = {
  id: string
  nombre: string
  tipo: string
  estado: string
  programada_para: string
  creado_en: string
  destinatarios: number
  enviados: number
}

export type SolicitudCrearCampana = {
  plantilla_id: string
  nombre: string
  tipo?: string
  programada_para?: string
}

export type RespuestaCrearCampana = {
  id_campana: string
}

export type SolicitudCargarInactivos = {
  campanaId: string
  dias: number
}

export type RespuestaCargarInactivos = {
  total_destinatarios: number
}

export type RespuestaDespachar = {
  enviados: number
}
