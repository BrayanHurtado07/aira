export type EstadoResena = 'PENDIENTE' | 'PUBLICADA' | 'MODERADA'

export type Resena = {
  id: string
  reserva_id: string
  estado: EstadoResena
  barbero_nombre: string
  puntaje_barbero: number
  comentario: string
  creado_en: string
}
