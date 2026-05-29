import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio';
import { obtenerTodasSucursales, crearSucursal, actualizarEstadoSucursal } from '../servicios/servicio-organizacion';
import type { SolicitudCrearSucursal } from '../contratos/tipos';

export function usarSedes() {
  const clienteConsulta = useQueryClient();

  const consulta = useQuery({
    queryKey: ['sucursales'],
    queryFn: () => obtenerTodasSucursales(),
  });

  const mutacionCrear = useMutation({
    mutationFn: (solicitud: SolicitudCrearSucursal) => crearSucursal(solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['sucursales'] });
    },
  });

  const mutacionEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'ACTIVO' | 'INACTIVO' }) =>
      actualizarEstadoSucursal(id, estado),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['sucursales'] });
    },
  });

  return {
    sedes: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error ? mensajeDeError(consulta.error) : null,
    crearSede: mutacionCrear.mutateAsync,
    creando: mutacionCrear.isPending,
    actualizarEstado: mutacionEstado.mutateAsync,
    actualizando: mutacionEstado.isPending,
  };
}
