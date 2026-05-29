import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listarProductos,
  crearProducto,
  listarStockSucursal,
  registrarMovimiento,
} from '../servicios/servicio-inventario'
import type { SolicitudCrearProducto, SolicitudRegistrarMovimiento } from '../contratos/tipos'

export function usarProductos() {
  const consulta = useQuery({
    queryKey: ['productos'],
    queryFn: () => listarProductos(),
  })
  return {
    productos: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarCrearProducto() {
  const clienteConsulta = useQueryClient()
  return useMutation({
    mutationFn: (solicitud: SolicitudCrearProducto) => crearProducto(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function usarStockSucursal(sucursalID: string) {
  const consulta = useQuery({
    queryKey: ['stock', sucursalID],
    queryFn: () => listarStockSucursal(sucursalID),
    enabled: !!sucursalID,
  })
  return {
    stock: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
  }
}

export function usarRegistrarMovimiento() {
  return useMutation({
    mutationFn: (solicitud: SolicitudRegistrarMovimiento) => registrarMovimiento(solicitud),
  })
}
