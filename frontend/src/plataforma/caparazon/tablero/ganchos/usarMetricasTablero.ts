import { useQuery } from '@tanstack/react-query';
import { obtenerMetricasTablero } from '../servicios/servicio-tablero';
import type { FiltroTablero, MetricasTablero } from '../contratos/tipos';

export function usarMetricasTablero(filtro: FiltroTablero) {
  return useQuery<MetricasTablero>({
    queryKey: ['tablero-metricas', filtro.inicio, filtro.fin, filtro.sucursalId],
    queryFn: () => obtenerMetricasTablero(filtro),
    staleTime: 60_000,
    refetchInterval: 120_000,
    placeholderData: (prev) => prev,
  });
}
