import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio';
import { ErrorHTTP } from '@/integraciones/http/errores';
import { rutaInicialPorRol } from '@/plataforma/identidad/roles';
import { iniciarSesion } from '../servicios/servicio-identidad';
import type { SolicitudIniciarSesion } from '../contratos/tipos';

export function usarIniciarSesion() {
  const guardarSesion = usarAlmacenSesion((s) => s.guardarSesion);
  const navegar = useNavigate();

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudIniciarSesion) => iniciarSesion(solicitud),
    onSuccess: (data) => {
      guardarSesion({
        token: data.token,
        refreshToken: data.refresh_token,
        sesionId: data.sesion_id,
        usuarioId: data.usuario_id,
        nombre: data.nombre,
        barberiaId: data.barberia_id,
        sedeId: data.sede_id,
        periodoId: data.periodo_id,
        expiraEn: data.expira_en,
        nombreRol: data.nombre_rol,
      });
      navegar(rutaInicialPorRol(data.nombre_rol));
    },
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
    error,
  };
}
