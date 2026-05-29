import { clienteHttp } from '@/integraciones/http/cliente';
import type {
  RespuestaIniciarSesion,
  SolicitudCambiarPassword,
  SolicitudIniciarSesion,
  SolicitudRegistrarUsuario,
  SolicitudSolicitarVerificacion,
  SolicitudVerificarCorreo,
  SolicitudSolicitarResetPassword,
  SolicitudRestablecerPassword,
  SolicitudRefrescarSesion,
  RespuestaRefrescarSesion,
} from '../contratos/tipos';

export const iniciarSesion = (solicitud: SolicitudIniciarSesion) =>
  clienteHttp.post<RespuestaIniciarSesion>('/identidad/sesion', solicitud);

export const registrarUsuario = (solicitud: SolicitudRegistrarUsuario) =>
  clienteHttp.post<void>('/identidad/usuarios', solicitud);

export const cambiarPassword = (solicitud: SolicitudCambiarPassword) =>
  clienteHttp.patch<void>('/identidad/password', solicitud);

export const inactivarUsuario = (usuarioId: string) =>
  clienteHttp.patch<void>(`/identidad/usuarios/${usuarioId}/inactivar`);

export const solicitarVerificacionCorreo = (solicitud: SolicitudSolicitarVerificacion) =>
  clienteHttp.post<void>('/auth/verificar-correo/solicitar', solicitud);

export const verificarCorreo = (solicitud: SolicitudVerificarCorreo) =>
  clienteHttp.post<void>('/auth/verificar-correo', solicitud);

export const solicitarResetPassword = (solicitud: SolicitudSolicitarResetPassword) =>
  clienteHttp.post<void>('/auth/restablecer-password/solicitar', solicitud);

export const restablecerPassword = (solicitud: SolicitudRestablecerPassword) =>
  clienteHttp.post<void>('/auth/restablecer-password', solicitud);

export const refrescarSesion = (solicitud: SolicitudRefrescarSesion): Promise<RespuestaRefrescarSesion> =>
  clienteHttp.post<RespuestaRefrescarSesion>('/auth/refresh', solicitud);
