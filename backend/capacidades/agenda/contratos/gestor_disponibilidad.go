package contratos

import "context"

type BloqueLibre struct {
	ID         string
	BarberoID  string
	SucursalID string
	DiaSemana  int
	HoraInicio string
	HoraFin    string
}

// GestorDisponibilidad es el contrato que Agenda expone hacia Reservas.
// Permite marcar un bloque como reservado o liberarlo al cancelar.
type GestorDisponibilidad interface {
	ObtenerLibre(ctx context.Context, disponibilidadID string) (BloqueLibre, error)
	MarcarReservada(ctx context.Context, disponibilidadID string) error
	LiberarBloque(ctx context.Context, disponibilidadID string) error
}

// ConsultorDisponibilidad es el contrato que Agenda expone hacia Canal WhatsApp.
// Permite listar bloques libres para una sede en una fecha.
type ConsultorDisponibilidad interface {
	ListarLibres(ctx context.Context, sucursalID, fecha string) ([]BloqueLibre, error)
}
