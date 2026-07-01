// Valores canónicos del dominio (definidos por la BD y usados por el bot):
//   conversacion.estado  → ACTIVA | CERRADA | EXPIRADA  (chk_conversacion_estado)
//   mensaje.direccion    → ENTRADA | SALIDA             (chk_mensaje_direccion)
//   mensaje.tipo         → TEXTO | IMAGEN | AUDIO | DOCUMENTO | UBICACION
export type EstadoConversacion = 'ACTIVA' | 'CERRADA' | 'EXPIRADA'

export type DireccionMensaje = 'ENTRADA' | 'SALIDA'

export type TipoMensaje = 'TEXTO' | 'IMAGEN' | 'AUDIO' | 'DOCUMENTO' | 'UBICACION'

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
  direccion: DireccionMensaje
  creado_en: string
}

export type SolicitudRegistrarMensaje = {
  conversacion_id: string
  contenido: string
  tipo: TipoMensaje
  direccion: DireccionMensaje
}

// Atajo: respuesta rápida que el operador inserta con 1 toque en el composer.
export type Atajo = {
  id: string
  empresa_id: string
  titulo: string
  contenido: string
  orden: number
}

export type SolicitudCrearAtajo = {
  titulo: string
  contenido: string
  orden?: number
}
