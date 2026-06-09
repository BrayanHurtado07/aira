import { clienteHttp } from '@/integraciones/http/cliente';

export type SolicitudCrearEmpresa = {
  nombre: string;
};

export type RespuestaCrearEmpresa = {
  id: string;
  nombre: string;
  slug: string;
};

export const crearEmpresa = (solicitud: SolicitudCrearEmpresa) =>
  clienteHttp.post<RespuestaCrearEmpresa>('/empresas', solicitud);
