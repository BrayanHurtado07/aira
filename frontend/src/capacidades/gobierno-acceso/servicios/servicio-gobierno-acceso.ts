import { clienteHttp } from '@/integraciones/http/cliente';
import type { Alcance, AlcanceResumen, RolResumen, SolicitudAsignarAlcance, UsuarioResumen } from '../contratos/tipos';

export const asignarAlcance = (solicitud: SolicitudAsignarAlcance): Promise<Alcance> =>
  clienteHttp.post<Alcance>('/alcances', solicitud);

export const revocarAlcance = (alcanceId: string): Promise<void> =>
  clienteHttp.delete<void>(`/alcances/${alcanceId}`);

export const listarAlcances = (): Promise<AlcanceResumen[]> =>
  clienteHttp.get<AlcanceResumen[]>('/alcances');

export const listarRoles = (): Promise<RolResumen[]> =>
  clienteHttp.get<RolResumen[]>('/roles');

export const listarUsuarios = (): Promise<UsuarioResumen[]> =>
  clienteHttp.get<UsuarioResumen[]>('/usuarios');
