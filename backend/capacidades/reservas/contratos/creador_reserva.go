package contratos

import "context"

type SolicitudReservaTelefonica struct {
	EmpresaID       string
	SucursalID      string
	ClienteID       string
	BarberoID       string
	ServicioID      string
	FechaHoraInicio string
	CreadoPor       string
}

type ResumenReserva struct {
	ReservaID string
	Estado    string
}

// CreadorReserva es el contrato que Reservas expone hacia Canal WhatsApp.
// Permite crear o cancelar reservas originadas desde el chat de WhatsApp.
type CreadorReserva interface {
	RegistrarDesdeChat(ctx context.Context, solicitud SolicitudReservaTelefonica) (ResumenReserva, error)
	CancelarDesdeChat(ctx context.Context, empresaID, reservaID, canceladoPor string) error
}
