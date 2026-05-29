import { clienteHttp } from '@/integraciones/http/cliente'
import type {
  Producto,
  SolicitudCrearProducto,
  StockSucursal,
  SolicitudRegistrarMovimiento,
} from '../contratos/tipos'

export const listarProductos = (): Promise<Producto[]> =>
  clienteHttp.get<Producto[]>('/productos')

export const crearProducto = (solicitud: SolicitudCrearProducto): Promise<{ producto_id: string }> =>
  clienteHttp.post<{ producto_id: string }>('/productos', solicitud)

export const listarStockSucursal = (sucursalID: string): Promise<StockSucursal[]> =>
  clienteHttp.get<StockSucursal[]>(`/sucursales/${sucursalID}/stock`)

export const registrarMovimiento = (
  solicitud: SolicitudRegistrarMovimiento,
): Promise<{ movimiento_id: string }> =>
  clienteHttp.post<{ movimiento_id: string }>('/inventario/movimientos', solicitud)
