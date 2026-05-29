export type EstadoDisponibilidad = 'LIBRE' | 'RESERVADO' | 'BLOQUEADO'

export type BloqueDisponibilidad = {
  id: string
  barbero_id: string
  sucursal_id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  estado: EstadoDisponibilidad
}

export type Barbero = {
  id: string
  id_empresa: string
  nombre: string
  telefono?: string
  especialidad?: string   // alias legacy — backend devuelve telefono
  estado: 'ACTIVO' | 'INACTIVO'
}

export type Servicio = {
  id: string
  id_empresa: string
  nombre: string
  duracion_minutos: number
  precio: number
  estado: string
}

export type SolicitudRegistrarBarbero = {
  nombre: string
  telefono?: string   // campo correcto para el backend
  especialidad?: string
  empresa_id?: string
}

export type SolicitudCrearServicio = {
  nombre: string
  duracion_minutos: number
  precio: number
  empresa_id?: string
}

export type SolicitudRegistrarDisponibilidad = {
  barbero_id: string
  sucursal_id?: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
}

export type SolicitudAsignarServicioBarbero = {
  servicio_id: string
}

export type SolicitudActualizarServicio = {
  nombre: string
  duracion_minutos: number
  precio: number
}

export type SlotsDisponibles = {
  fecha: string
  duracion_minutos: number
  sucursal_id: string
  slots: string[]  // ["09:00", "09:30", ...]
}

export type MotivoExcepcion = 'FERIADO' | 'VACACION' | 'CIERRE' | 'OTRO'

export type ExcepcionDisponibilidad = {
  id: string
  barbero_id: string
  sucursal_id: string
  fecha: string         // "YYYY-MM-DD"
  motivo: MotivoExcepcion
  descripcion?: string
  creado_en?: string
}

export type SolicitudRegistrarExcepcion = {
  fecha: string
  motivo: MotivoExcepcion
  descripcion?: string
  sucursal_id?: string
}

// ── Tarifas especiales ────────────────────────────────────────────────────────

export type TarifaEspecial = {
  id: string
  sucursal_id: string
  servicio_id: string
  fecha: string
  precio_especial: number
  motivo: string
}

export type SolicitudCrearTarifa = {
  servicio_id: string
  fecha: string
  precio_especial: number
  motivo?: string
}
