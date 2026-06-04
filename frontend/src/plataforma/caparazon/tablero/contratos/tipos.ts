export type FiltroTablero = {
  inicio: string;   // 'YYYY-MM-DD'
  fin: string;      // 'YYYY-MM-DD'
  sucursalId?: string;
};

export type PeriodoMetricas = {
  inicio: string;
  fin: string;
};

export type ResumenReservas = {
  total: number;
  completadas: number;
  confirmadas: number;
  pendientes: number;
  canceladas: number;
  no_asistio: number;
  tasa_completado: number;
};

export type ResumenIngresos = {
  total: number;
  variacion_pct: number;
};

export type ResumenClientes = {
  total: number;
  nuevos: number;
};

export type ResumenHoy = {
  reservas_total: number;
  reservas_completadas: number;
  reservas_pendientes: number;
  ingresos: number;
};

export type MetricaBarbero = {
  id_barbero: string;
  nombre: string;
  reservas: number;
  completadas: number;
  no_asistio: number;
  ingresos: number;
  rating_promedio: number;
  comision_pendiente: number;
};

export type MetricaServicio = {
  id_servicio: string;
  nombre: string;
  veces_vendido: number;
  ingreso_total: number;
};

export type OrigenReservas = {
  whatsapp: number;
  web: number;
  manual: number;
};

export type MetricaLealtad = {
  tarjetas_activas: number;
  sellos_acumulados: number;
  listos_para_canjear: number;
  canjes_periodo: number;
};

export type AlertaInventario = {
  id_producto: string;
  nombre: string;
  cantidad_actual: number;
  cantidad_minima: number;
};

export type MetricasTablero = {
  periodo: PeriodoMetricas;
  reservas: ResumenReservas;
  ingresos: ResumenIngresos;
  clientes: ResumenClientes;
  hoy: ResumenHoy;
  barberos: MetricaBarbero[];
  servicios_top: MetricaServicio[];
  origen_reservas: OrigenReservas;
  lealtad: MetricaLealtad;
  inventario_alertas: AlertaInventario[];
  comisiones_pendientes: number;
};
