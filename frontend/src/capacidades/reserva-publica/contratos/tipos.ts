import type { Barbero, Servicio, BloqueDisponibilidad } from '@/capacidades/agenda/contratos/tipos'

export type { Barbero, Servicio, BloqueDisponibilidad }

export type Sucursal = {
  id: string
  nombre: string
  empresa_id: string
}

export type SlotLibre = BloqueDisponibilidad & { estado: 'LIBRE' }

export type SeleccionReserva = {
  empresaID: string
  sucursalID: string
  servicio: Servicio | null
  barbero: Barbero | null
  slot: BloqueDisponibilidad | null
  fecha: string
}

export type SolicitudReservaPublica = {
  empresa_id: string
  sucursal_id: string
  barbero_id: string
  servicio_id: string
  fecha_hora_inicio: string
  cliente_nombre: string
  cliente_telefono: string
  cliente_correo?: string
}

export type RespuestaReservaPublica = {
  reserva_id: string
  estado: string
}
