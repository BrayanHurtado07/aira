export type EstadoSello = 'ACUMULADO' | 'ANULADO' | 'CANJEADO'

export type Sello = {
  id: string
  empresa_id: string
  cliente_id: string
  estado: EstadoSello
  creado_en: string
}

export type SolicitudAcumularSello = {
  empresa_id?: string
  cliente_id: string
  reserva_id: string
}

export type SolicitudAplicarCanje = {
  tarjeta_id: string
  reserva_id: string
  sellos_a_usar: number
  descripcion: string
}

export type TarjetaLealtad = {
  tarjeta_id: string
  cliente_id: string
  nombre_cliente: string
  telefono: string
  sellos_activos: number
  total_canjes: number
}

export type ProgramaLealtad = {
  id: string
  nombre: string
  sellos_para_recompensa: number
  descripcion_recompensa: string
  estado: string
}

export type SelloActivo = {
  sello_id: string
  cliente_id: string
  reserva_id: string
  creado_en: string
}

export type SolicitudCrearProgramaLealtad = {
  nombre: string
  sellos_para_recompensa: number
  descripcion_recompensa: string
}
