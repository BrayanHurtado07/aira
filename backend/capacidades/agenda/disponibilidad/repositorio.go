package disponibilidad

import "context"

type BloqueDisponibilidad struct {
	ID         string `json:"id"`
	BarberoID  string `json:"barbero_id"`
	SucursalID string `json:"sucursal_id"`
	DiaSemana  int    `json:"dia_semana"`
	HoraInicio string `json:"hora_inicio"`
	HoraFin    string `json:"hora_fin"`
}

type RepositorioDisponibilidad interface {
	Registrar(ctx context.Context, bloque BloqueDisponibilidad) (string, error)
	ObtenerPorBarberoYDia(ctx context.Context, barberoID string, diaSemana int) ([]BloqueDisponibilidad, error)
	ObtenerPorID(ctx context.Context, disponibilidadID string) (BloqueDisponibilidad, error)
	MarcarReservada(ctx context.Context, disponibilidadID string) error
	LiberarBloque(ctx context.Context, disponibilidadID string) error
	ListarLibres(ctx context.Context, sucursalID, fecha string) ([]BloqueDisponibilidad, error)
}
