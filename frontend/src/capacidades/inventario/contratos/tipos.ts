export type TipoProducto = 'INSUMO_BARBERO' | 'CONSUMIBLE_CLIENTE'
export type EstadoProducto = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO'
export type TipoMovimiento = 'COMPRA' | 'CONSUMO_SERVICIO' | 'CONSUMO_COMPLEMENTO' | 'AJUSTE' | 'DEVOLUCION'

export type Producto = {
  id: string
  empresa_id: string
  nombre: string
  codigo: string
  tipo: TipoProducto
  precio_unitario: number
  descripcion: string
  estado: EstadoProducto
}

export type SolicitudCrearProducto = {
  nombre: string
  codigo: string
  tipo: TipoProducto
  precio_unitario: number
  descripcion?: string
}

export type StockSucursal = {
  producto_id: string
  sucursal_id: string
  cantidad_actual: number
  cantidad_minima: number
}

export type SolicitudRegistrarMovimiento = {
  producto_id: string
  sucursal_id: string
  tipo_movimiento: TipoMovimiento
  cantidad: number
  causa_descripcion?: string
  reserva_id?: string
}
