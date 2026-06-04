import { clienteHttp } from '@/integraciones/http/cliente';
import type { FiltroTablero, MetricasTablero } from '../contratos/tipos';

export function obtenerMetricasTablero(filtro: FiltroTablero): Promise<MetricasTablero> {
  const params = new URLSearchParams({ inicio: filtro.inicio, fin: filtro.fin });
  if (filtro.sucursalId) params.set('sucursal_id', filtro.sucursalId);
  return clienteHttp.get<MetricasTablero>(`/tablero/metricas?${params}`);
}
