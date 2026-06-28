import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  aprobarLiquidacion,
  calcularLiquidacion,
  crearEsquemaComision,
  generarComision,
  listarComisiones,
  listarLiquidaciones,
  pagarLiquidacion,
} from '../servicios/servicio-comisiones'
import type {
  SolicitudCalcularLiquidacion,
  SolicitudCrearEsquema,
  SolicitudGenerarComision,
} from '../contratos/tipos'

const CLAVE_COMISIONES = ['comisiones'] as const
const CLAVE_LIQUIDACIONES = ['liquidaciones'] as const

// ── Lecturas ──────────────────────────────────────────────────────────────────

export function usarComisiones() {
  const consulta = useQuery({
    queryKey: CLAVE_COMISIONES,
    queryFn: () => listarComisiones(),
  })
  return {
    comisiones: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarLiquidaciones() {
  const consulta = useQuery({
    queryKey: CLAVE_LIQUIDACIONES,
    queryFn: () => listarLiquidaciones(),
  })
  return {
    liquidaciones: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

// ── Mutaciones de comisiones ──────────────────────────────────────────────────

export function usarCrearEsquema() {
  const clienteConsulta = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudCrearEsquema) => crearEsquemaComision(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: CLAVE_COMISIONES })
    },
  })
  return {
    crearEsquema: mutacion.mutate,
    ejecutando: mutacion.isPending,
    error: mutacion.error,
  }
}

export function usarGenerarComision() {
  const clienteConsulta = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudGenerarComision) => generarComision(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: CLAVE_COMISIONES })
    },
  })
  return {
    generar: mutacion.mutate,
    ejecutando: mutacion.isPending,
    error: mutacion.error,
  }
}

// ── Mutaciones de liquidaciones ───────────────────────────────────────────────

export function usarCalcularLiquidacion() {
  const clienteConsulta = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudCalcularLiquidacion) => calcularLiquidacion(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: CLAVE_LIQUIDACIONES })
      clienteConsulta.invalidateQueries({ queryKey: CLAVE_COMISIONES })
    },
  })
  return {
    calcular: mutacion.mutate,
    ejecutando: mutacion.isPending,
    error: mutacion.error,
  }
}

export function usarAccionesLiquidacion() {
  const clienteConsulta = useQueryClient()

  const invalidar = () => {
    clienteConsulta.invalidateQueries({ queryKey: CLAVE_LIQUIDACIONES })
    clienteConsulta.invalidateQueries({ queryKey: CLAVE_COMISIONES })
  }

  const mutacionAprobar = useMutation({
    mutationFn: (liquidacionId: string) => aprobarLiquidacion(liquidacionId),
    onSuccess: invalidar,
  })

  const mutacionPagar = useMutation({
    mutationFn: (liquidacionId: string) => pagarLiquidacion(liquidacionId),
    onSuccess: invalidar,
  })

  return {
    aprobar: mutacionAprobar.mutate,
    pagar: mutacionPagar.mutate,
    aprobando: mutacionAprobar.isPending,
    pagando: mutacionPagar.isPending,
    error: mutacionAprobar.error ?? mutacionPagar.error,
  }
}
