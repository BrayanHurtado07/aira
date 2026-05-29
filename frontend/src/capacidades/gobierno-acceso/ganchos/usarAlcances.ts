import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  asignarAlcance,
  revocarAlcance,
  listarAlcances,
  listarRoles,
  listarUsuarios,
} from '../servicios/servicio-gobierno-acceso';
import type { SolicitudAsignarAlcance } from '../contratos/tipos';

export function usarAlcances() {
  const clienteConsulta = useQueryClient();

  const consultaAlcances = useQuery({
    queryKey: ['alcances'],
    queryFn: () => listarAlcances(),
  });

  const consultaRoles = useQuery({
    queryKey: ['roles'],
    queryFn: () => listarRoles(),
  });

  const consultaUsuarios = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => listarUsuarios(),
  });

  const mutacionAsignar = useMutation({
    mutationFn: (solicitud: SolicitudAsignarAlcance) => asignarAlcance(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['alcances'] });
    },
  });

  const mutacionRevocar = useMutation({
    mutationFn: (alcanceId: string) => revocarAlcance(alcanceId),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['alcances'] });
    },
  });

  return {
    alcances:  consultaAlcances.data ?? [],
    roles:     consultaRoles.data ?? [],
    usuarios:  consultaUsuarios.data ?? [],
    cargando:  consultaAlcances.isLoading,
    asignar:   mutacionAsignar.mutate,
    revocar:   mutacionRevocar.mutate,
    asignando: mutacionAsignar.isPending,
    revocando: mutacionRevocar.isPending,
    exitoAsignar: mutacionAsignar.isSuccess,
    errorAsignar: mutacionAsignar.error,
    errorRevocar: mutacionRevocar.error,
  };
}
