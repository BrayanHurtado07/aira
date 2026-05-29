export type EstadoSuscripcion = 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA'

export type Suscripcion = {
  id: string
  id_empresa: string
  id_plan: string
  estado: EstadoSuscripcion
  fecha_inicio: string
  fecha_renovacion: string
}

export type SolicitudActivarSuscripcion = {
  empresa_id: string
  plan_id: string
  fecha_inicio: string
  fecha_renovacion: string
}

export type PlanResumen = {
  id: string
  nombre: string
  estado: string
}

export type SuscripcionResumen = {
  id: string
  empresa_id: string
  plan_id: string
  nombre_plan: string
  estado: EstadoSuscripcion
  fecha_inicio: string
  fecha_renovacion: string
}
