import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia';
import type { EstadoReserva as TipoEstadoReserva } from '@/capacidades/reservas/contratos/tipos';

const MAPA: Record<TipoEstadoReserva, { etiqueta: string; variante: Parameters<typeof Insignia>[0]['variante'] }> = {
  PENDIENTE:   { etiqueta: 'Pendiente',  variante: 'advertencia' },
  CONFIRMADA:  { etiqueta: 'Confirmada', variante: 'exito' },
  CANCELADA:   { etiqueta: 'Cancelada',  variante: 'error' },
  COMPLETADA:  { etiqueta: 'Completada', variante: 'primario' },
  NO_ASISTIO:  { etiqueta: 'No asistió', variante: 'neutral' },
};

export function EstadoReserva({ estado }: { estado: TipoEstadoReserva }) {
  const { etiqueta, variante } = MAPA[estado] ?? { etiqueta: estado, variante: 'neutral' as const };
  return <Insignia variante={variante}>{etiqueta}</Insignia>;
}
