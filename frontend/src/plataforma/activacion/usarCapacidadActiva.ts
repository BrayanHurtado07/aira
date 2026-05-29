import { usarAlmacenCapacidades } from './almacen-capacidades';

export function usarCapacidadActiva(codigo: string) {
  return usarAlmacenCapacidades((s) => s.capacidades[codigo] ?? 'habilitada');
}
