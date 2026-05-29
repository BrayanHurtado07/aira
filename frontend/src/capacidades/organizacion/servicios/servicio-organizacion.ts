import { clienteHttp } from '@/integraciones/http/cliente';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import type { Periodo, Sucursal, SolicitudCrearPeriodo, SolicitudCrearSucursal, ConfiguracionEmpresa, SolicitudGuardarConfiguracion } from '../contratos/tipos';

const barberiaId = () => usarAlmacenSesion.getState().sesion?.barberiaId ?? '';

export const obtenerSucursales = () =>
  clienteHttp.get<Sucursal[]>('/sucursales');

export const obtenerTodasSucursales = () =>
  clienteHttp.get<Sucursal[]>('/sucursales/todas');

export const actualizarEstadoSucursal = (sucursalId: string, estado: 'ACTIVO' | 'INACTIVO') =>
  clienteHttp.patch<void>(`/sucursales/${sucursalId}/estado`, { estado });

export const crearSucursal = (solicitud: SolicitudCrearSucursal) =>
  clienteHttp.post<Sucursal>(`/empresas/${barberiaId()}/sucursales`, solicitud);

export const listarPeriodos = () =>
  clienteHttp.get<Periodo[]>('/periodos');

export const crearPeriodo = (solicitud: SolicitudCrearPeriodo) =>
  clienteHttp.post<Periodo>(`/empresas/${barberiaId()}/periodos`, solicitud);

export const cerrarPeriodo = (periodoId: string) =>
  clienteHttp.post<void>(`/periodos/${periodoId}/cerrar`);

export const obtenerConfiguracion = () =>
  clienteHttp.get<ConfiguracionEmpresa>('/empresas/configuracion');

export const guardarConfiguracion = (solicitud: SolicitudGuardarConfiguracion) =>
  clienteHttp.put<void>('/empresas/configuracion', solicitud);
