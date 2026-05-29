import { clienteHttp } from '@/integraciones/http/cliente';
import type {
  RespuestaIniciarSesion,
  RespuestaRegistrar,
  SolicitudIniciarSesion,
  SolicitudRegistrarUsuario,
} from './contratos/tipos';

export async function iniciarSesionGlobal(
  solicitud: SolicitudIniciarSesion,
): Promise<RespuestaIniciarSesion> {
  return clienteHttp.post<RespuestaIniciarSesion>('/auth/sesion', solicitud);
}

export async function cerrarSesionGlobal(): Promise<void> {
  return clienteHttp.post('/auth/cerrar-sesion');
}

export async function registrarUsuario(
  solicitud: SolicitudRegistrarUsuario,
): Promise<RespuestaRegistrar> {
  return clienteHttp.post<RespuestaRegistrar>('/auth/registrar', solicitud);
}
