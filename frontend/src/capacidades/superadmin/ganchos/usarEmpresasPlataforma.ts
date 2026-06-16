import { useQuery } from '@tanstack/react-query';
import { listarEmpresasPlataforma } from '../servicios/servicio-superadmin';

export function usarEmpresasPlataforma() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['superadmin', 'empresas'],
    queryFn:  listarEmpresasPlataforma,
    staleTime: 30_000,
  });

  return {
    empresas:  data?.empresas ?? [],
    total:     data?.total    ?? 0,
    cargando:  isLoading,
    error:     isError,
    recargar:  refetch,
  };
}
