import { clienteHttp } from '@/integraciones/http/cliente'
import type {
  Barbero,
  Servicio,
  BloqueDisponibilidad,
  SolicitudRegistrarBarbero,
  SolicitudCrearServicio,
  SolicitudActualizarServicio,
  SolicitudRegistrarDisponibilidad,
  SolicitudAsignarServicioBarbero,
  SlotsDisponibles,
  ExcepcionDisponibilidad,
  SolicitudRegistrarExcepcion,
  TarifaEspecial,
  SolicitudCrearTarifa,
} from '@/capacidades/agenda/contratos/tipos'

export const obtenerBarberos = () =>
  clienteHttp.get<Barbero[]>('/barberos')

export const registrarBarbero = (solicitud: SolicitudRegistrarBarbero) =>
  clienteHttp.post<Barbero>('/barberos', solicitud)

export const obtenerServicios = () =>
  clienteHttp.get<Servicio[]>('/servicios')

export const crearServicio = (solicitud: SolicitudCrearServicio) =>
  clienteHttp.post<Servicio>('/servicios', solicitud)

export const actualizarServicio = (servicioId: string, solicitud: SolicitudActualizarServicio) =>
  clienteHttp.patch<void>(`/servicios/${servicioId}`, solicitud)

export const cambiarEstadoServicio = (servicioId: string, estado: 'ACTIVO' | 'INACTIVO') =>
  clienteHttp.patch<void>(`/servicios/${servicioId}/estado`, { estado })

export const registrarDisponibilidad = (solicitud: SolicitudRegistrarDisponibilidad) =>
  clienteHttp.post<BloqueDisponibilidad>('/disponibilidad', solicitud)

export const asignarServicioBarbero = (
  barberoId: string,
  solicitud: SolicitudAsignarServicioBarbero,
) => clienteHttp.post<void>(`/barberos/${barberoId}/servicios`, solicitud)

export const obtenerDisponibilidadBarbero = (barberoId: string) =>
  clienteHttp.get<BloqueDisponibilidad[]>(`/disponibilidad/${barberoId}`)

export const obtenerServiciosBarbero = (barberoId: string) =>
  clienteHttp.get<Servicio[]>(`/barberos/${barberoId}/servicios`)

export const consultarSlotsDisponibles = (barberoId: string, servicioId: string, fecha: string) =>
  clienteHttp.get<SlotsDisponibles>(
    `/agenda/slots?barbero_id=${barberoId}&servicio_id=${servicioId}&fecha=${fecha}`,
  )

export const desasignarServicioBarbero = (barberoId: string, servicioId: string) =>
  clienteHttp.delete<void>(`/barberos/${barberoId}/servicios/${servicioId}`)

export const actualizarBarbero = (
  barberoId: string,
  datos: { nombre: string; telefono?: string },
) => clienteHttp.patch<void>(`/barberos/${barberoId}`, datos)

export const cambiarEstadoBarbero = (
  barberoId: string,
  estado: 'ACTIVO' | 'INACTIVO',
) => clienteHttp.patch<void>(`/barberos/${barberoId}/estado`, { estado })

export const registrarExcepcionDisponibilidad = (
  barberoId: string,
  solicitud: SolicitudRegistrarExcepcion,
) => clienteHttp.post<{ excepcion_id: string }>(`/barberos/${barberoId}/excepciones`, solicitud)

export const listarExcepcionesBarbero = (barberoId: string) =>
  clienteHttp.get<ExcepcionDisponibilidad[]>(`/barberos/${barberoId}/excepciones`)

export const eliminarExcepcionDisponibilidad = (barberoId: string, excepcionId: string) =>
  clienteHttp.delete<void>(`/barberos/${barberoId}/excepciones/${excepcionId}`)

export const listarTarifasSucursal = (sucursalID: string): Promise<TarifaEspecial[]> =>
  clienteHttp.get<TarifaEspecial[]>(`/sucursales/${sucursalID}/tarifas`)

export const crearTarifaEspecial = (
  sucursalID: string,
  solicitud: SolicitudCrearTarifa,
): Promise<{ tarifa_id: string }> =>
  clienteHttp.post<{ tarifa_id: string }>(`/sucursales/${sucursalID}/tarifas`, solicitud)

export const eliminarTarifaEspecial = (tarifaID: string): Promise<void> =>
  clienteHttp.delete<void>(`/tarifas/${tarifaID}`)
