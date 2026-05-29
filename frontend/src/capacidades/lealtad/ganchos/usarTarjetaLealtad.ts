import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acumularSello,
  anularSello,
  aplicarCanje,
  crearPrograma,
  obtenerPrograma,
  obtenerTarjetas,
  obtenerTarjetaCliente,
  listarSellosCliente,
} from '../servicios/servicio-lealtad'
import type { SolicitudAcumularSello, SolicitudAplicarCanje, SolicitudCrearProgramaLealtad } from '../contratos/tipos'

export function usarCrearPrograma() {
  const clienteConsulta = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudCrearProgramaLealtad) => crearPrograma(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['lealtad', 'programa'] })
    },
  })
  return {
    crear: mutacion.mutate,
    ejecutando: mutacion.isPending,
    exitoso: mutacion.isSuccess,
    error: mutacion.error,
  }
}

export function usarPrograma() {
  const consulta = useQuery({
    queryKey: ['lealtad', 'programa'],
    queryFn: () => obtenerPrograma(),
    retry: false,
  })
  return {
    programa: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarTarjetas() {
  const consulta = useQuery({
    queryKey: ['lealtad', 'tarjetas'],
    queryFn: () => obtenerTarjetas(),
  })
  return {
    tarjetas: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarSellosCliente(clienteId: string) {
  const consulta = useQuery({
    queryKey: ['lealtad', 'sellos', clienteId],
    queryFn: () => listarSellosCliente(clienteId),
    enabled: clienteId.length > 0,
    retry: false,
  })
  return {
    sellos: consulta.data ?? [],
    cargando: consulta.isLoading,
  }
}

export function usarTarjetaDeCliente(clienteId: string) {
  const consulta = useQuery({
    queryKey: ['lealtad', 'tarjeta', clienteId],
    queryFn: () => obtenerTarjetaCliente(clienteId),
    enabled: clienteId.length > 0,
    retry: false,
  })
  return {
    tarjeta: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarTarjetaLealtad() {
  const clienteConsulta = useQueryClient()

  const mutacionAcumular = useMutation({
    mutationFn: (solicitud: SolicitudAcumularSello) => acumularSello(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['sellos'] })
      clienteConsulta.invalidateQueries({ queryKey: ['lealtad'] })
    },
  })

  const mutacionAnular = useMutation({
    mutationFn: ({ selloId, motivo }: { selloId: string; motivo: string }) =>
      anularSello(selloId, motivo),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['sellos'] })
      clienteConsulta.invalidateQueries({ queryKey: ['lealtad'] })
    },
  })

  const mutacionCanjear = useMutation({
    mutationFn: (solicitud: SolicitudAplicarCanje) => aplicarCanje(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['canjes'] })
      clienteConsulta.invalidateQueries({ queryKey: ['lealtad'] })
    },
  })

  return {
    acumular: mutacionAcumular.mutate,
    anular: mutacionAnular.mutate,
    canjear: mutacionCanjear.mutate,
    ejecutando:
      mutacionAcumular.isPending ||
      mutacionAnular.isPending ||
      mutacionCanjear.isPending,
    error:
      mutacionAcumular.error ??
      mutacionAnular.error ??
      mutacionCanjear.error,
    estadoAcumular: {
      exitoso: mutacionAcumular.isSuccess,
      ejecutando: mutacionAcumular.isPending,
      error: mutacionAcumular.error,
    },
    estadoAnular: {
      exitoso: mutacionAnular.isSuccess,
      ejecutando: mutacionAnular.isPending,
      error: mutacionAnular.error,
    },
    estadoCanjear: {
      exitoso: mutacionCanjear.isSuccess,
      ejecutando: mutacionCanjear.isPending,
      error: mutacionCanjear.error,
    },
  }
}
