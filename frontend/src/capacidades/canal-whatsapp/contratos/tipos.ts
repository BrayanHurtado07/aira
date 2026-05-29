export type EstadoConversacion = 'ACTIVA' | 'CERRADA'

export type Conversacion = {
  id: string
  empresa_id: string
  numero_cliente: string
  estado: EstadoConversacion
  creado_en: string
}

export type Mensaje = {
  id: string
  conversacion_id: string
  contenido: string
  tipo: string
  direccion: 'ENTRANTE' | 'SALIENTE'
  creado_en: string
}

export type SolicitudRegistrarMensaje = {
  conversacion_id: string
  contenido: string
  tipo: string
  direccion: 'ENTRANTE' | 'SALIENTE'
}
