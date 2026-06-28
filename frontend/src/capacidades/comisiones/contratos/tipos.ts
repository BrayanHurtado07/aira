// Contratos de la capacidad Comisiones.
// Las formas reflejan exactamente las lecturas del backend
// (capacidades/comisiones/repositorio.go). Los montos llegan como string.

export type EstadoComision = 'GENERADA' | 'PENDIENTE' | 'LIQUIDADA' | 'ANULADA'

export type Comision = {
  id: string
  barbero_id: string
  barbero_nombre: string
  reserva_id: string
  monto_calculado: string
  estado: string
  generado_en: string
}

export type EstadoLiquidacion = 'PENDIENTE' | 'APROBADA' | 'PAGADA'

export type FrecuenciaLiquidacion = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'

export type Liquidacion = {
  id: string
  barbero_id: string
  barbero_nombre: string
  fecha_inicio: string
  fecha_fin: string
  monto_total: string
  frecuencia: string
  estado: string
}

// ── Solicitudes ───────────────────────────────────────────────────────────────

export type SolicitudCrearEsquema = {
  nombre: string
  tipo?: string
  sueldo_base?: number
  porcentaje_por_servicio: number
  descripcion?: string
}

export type SolicitudGenerarComision = {
  reserva_id: string
}

export type SolicitudCalcularLiquidacion = {
  barbero_id: string
  fecha_inicio: string
  fecha_fin: string
  frecuencia: FrecuenciaLiquidacion
}
