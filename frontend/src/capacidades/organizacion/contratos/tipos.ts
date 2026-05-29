export type Sucursal = {
  id: string;
  id_empresa: string;
  nombre: string;
  estado: string;
};

export type Periodo = {
  id: string;
  id_empresa: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
};

export type SolicitudCrearSucursal = {
  nombre: string;
};

export type SolicitudCrearPeriodo = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
};

export type ConfiguracionEmpresa = {
  EmpresaID: string;
  HorasAnticipacionCancelacion: number;
  DiasMaxReservaAnticipada: number;
  HorasRecordatorioReserva: number;
  PermiteReservaMismoDia: boolean;
  RequiereConfirmacionManual: boolean;
};

export type SolicitudGuardarConfiguracion = {
  horas_anticipacion_cancelacion: number;
  dias_max_reserva_anticipada: number;
  horas_recordatorio_reserva: number;
  permite_reserva_mismo_dia: boolean;
  requiere_confirmacion_manual: boolean;
};
