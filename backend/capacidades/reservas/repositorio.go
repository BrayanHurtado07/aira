package reservas

import "context"

type SolicitudGuardarReserva struct {
	EmpresaID        string
	SucursalID       string
	ClienteID        string
	BarberoID        string
	ServicioID       string
	FechaHoraInicio  string
	Origen           string
	CreadoPor        string
	DisponibilidadID string // opcional
}

type RepositorioReserva interface {
	Guardar(ctx context.Context, solicitud SolicitudGuardarReserva) (Reserva, error)
	ObtenerPorID(ctx context.Context, id string) (Reserva, error)
	Confirmar(ctx context.Context, id, confirmadoPor string) error
	Cancelar(ctx context.Context, id, canceladoPor string) error
	Completar(ctx context.Context, id, completadoPor string) error
	MarcarNoAsistio(ctx context.Context, id, marcadoPor string) error
	ActualizarReserva(ctx context.Context, reservaID, clienteID, barberoID, servicioID, fechaHoraInicio, origen string) error
}
