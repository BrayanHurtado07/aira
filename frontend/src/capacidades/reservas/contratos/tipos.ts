export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'NO_ASISTIO'

export type OrigenReserva = 'WHATSAPP' | 'WEB' | 'MANUAL'

export type Reserva = {
  id: string
  id_empresa: string
  sucursal_id: string
  cliente_id: string
  barbero_id: string
  fecha_hora_inicio: string
  estado: EstadoReserva
  origen: OrigenReserva
}

export type ResumenReserva = {
  id: string
  nombre_cliente: string
  nombre_barbero: string
  fecha: string
  hora_inicio: string
  estado: EstadoReserva
}

export type SolicitudRegistrarReserva = {
  cliente_id: string
  barbero_id: string
  servicio_id: string
  sucursal_id?: string
  fecha_hora_inicio: string
  origen: OrigenReserva
}

export type Cliente = {
  id: string
  id_empresa: string
  nombre: string
  telefono: string
  correo: string
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'
}

export type SolicitudRegistrarCliente = {
  nombre: string
  telefono: string
  correo_electronico?: string
}

export type SolicitudActualizarCliente = {
  nombre: string
  telefono: string
  correo_electronico?: string
}

export type SolicitudActualizarReserva = {
  cliente_id: string
  barbero_id: string
  servicio_id: string
  fecha_hora_inicio: string
  origen: OrigenReserva
}

// ── Lista de espera ───────────────────────────────────────────────────────────

export type EstadoListaEspera = 'ESPERANDO' | 'NOTIFICADO' | 'ATENDIDO' | 'CANCELADO'

export type EntradaListaEspera = {
  id: string
  empresa_id: string
  cliente_id: string
  sucursal_id: string
  servicio_id: string
  barbero_id: string
  fecha_hora_deseada: string
  estado: EstadoListaEspera
}

export type SolicitudIngresarListaEspera = {
  cliente_id: string
  sucursal_id: string
  servicio_id: string
  barbero_id?: string
  fecha_hora_deseada: string
}

// ── Complementos de reserva ───────────────────────────────────────────────────

export type ComplementoReservaItem = {
  producto_id: string
  nombre_producto: string
  cantidad: number
}

export type SolicitudAgregarComplemento = {
  producto_id: string
  cantidad: number
}
