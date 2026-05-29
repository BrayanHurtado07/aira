package barberias

// ConfiguracionEmpresa define las reglas operativas de una barbería:
// ventanas de cancelación, anticipación máxima de reserva,
// recordatorios y comportamientos de confirmación.
type ConfiguracionEmpresa struct {
	EmpresaID                    string
	HorasAnticipacionCancelacion int
	DiasMaxReservaAnticipada     int
	HorasRecordatorioReserva     int
	PermiteReservaMismoDia       bool
	RequiereConfirmacionManual   bool
}
