import { useMutation } from '@tanstack/react-query';
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio';
import { ErrorHTTP } from '@/integraciones/http/errores';
import { cambiarPassword } from '../servicios/servicio-identidad';
import type { SolicitudCambiarPassword } from '../contratos/tipos';

export function usarCambiarPassword() {
  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudCambiarPassword) => cambiarPassword(solicitud),
  });

  const error =
    mutacion.error instanceof ErrorHTTP
      ? mensajeDeError(mutacion.error.codigo)
      : mutacion.error
        ? mensajeDeError('error_desconocido')
        : null;

  return {
    ejecutar: mutacion.mutate,
    enviando: mutacion.isPending,
    exito: mutacion.isSuccess,
    error,
  };
}
