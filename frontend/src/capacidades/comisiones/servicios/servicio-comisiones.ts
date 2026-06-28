import { clienteHttp } from '@/integraciones/http/cliente'
import type {
  Comision,
  Liquidacion,
  SolicitudCalcularLiquidacion,
  SolicitudCrearEsquema,
  SolicitudGenerarComision,
} from '../contratos/tipos'

// ── Comisiones ────────────────────────────────────────────────────────────────

export const listarComisiones = (): Promise<Comision[]> =>
  clienteHttp.get<Comision[]>('/comisiones')

export const crearEsquemaComision = (
  solicitud: SolicitudCrearEsquema,
): Promise<{ id_esquema: string }> =>
  clienteHttp.post<{ id_esquema: string }>('/comisiones/esquemas', solicitud)

export const generarComision = (
  solicitud: SolicitudGenerarComision,
): Promise<{ id_comision: string }> =>
  clienteHttp.post<{ id_comision: string }>('/comisiones/generar', solicitud)

// ── Liquidaciones ─────────────────────────────────────────────────────────────

export const listarLiquidaciones = (): Promise<Liquidacion[]> =>
  clienteHttp.get<Liquidacion[]>('/liquidaciones')

export const calcularLiquidacion = (
  solicitud: SolicitudCalcularLiquidacion,
): Promise<{ id_liquidacion: string }> =>
  clienteHttp.post<{ id_liquidacion: string }>('/liquidaciones/calcular', solicitud)

export const aprobarLiquidacion = (liquidacionId: string): Promise<void> =>
  clienteHttp.post<void>(`/liquidaciones/${liquidacionId}/aprobar`)

export const pagarLiquidacion = (liquidacionId: string): Promise<void> =>
  clienteHttp.post<void>(`/liquidaciones/${liquidacionId}/pagar`)
