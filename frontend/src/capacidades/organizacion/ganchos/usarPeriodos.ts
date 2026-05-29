import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio';
import { listarPeriodos, crearPeriodo, cerrarPeriodo } from '../servicios/servicio-organizacion';
import type { SolicitudCrearPeriodo } from '../contratos/tipos';

export function usarPeriodos() {
  const clienteConsulta = useQueryClient();

  const consulta = useQuery({
    queryKey: ['periodos'],
    queryFn: () => listarPeriodos(),
  });

  const mutacionCrear = useMutation({
    mutationFn: (solicitud: SolicitudCrearPeriodo) => crearPeriodo(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['periodos'] });
    },
  });

  const mutacionCerrar = useMutation({
    mutationFn: (periodoId: string) => cerrarPeriodo(periodoId),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['periodos'] });
    },
  });

  return {
    periodos: consulta.data ?? [],
    cargando: consulta.isLoading,
    crearPeriodo: mutacionCrear.mutate,
    cerrarPeriodo: mutacionCerrar.mutateAsync,
    creando: mutacionCrear.isPending,
    cerrando: mutacionCerrar.isPending,
    error: consulta.error ? mensajeDeError(consulta.error) : null,
  };
}
