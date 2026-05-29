package barberos

import "context"

type RepositorioBarbero interface {
	ObtenerActivo(ctx context.Context, id string) (Barbero, error)
	Guardar(ctx context.Context, barbero Barbero, fotoURL string) (string, error)
	AsignarServicio(ctx context.Context, barberoID, servicioID string) error
	ActualizarBarbero(ctx context.Context, barberoID, nombre, telefono string) error
	ActualizarEstadoBarbero(ctx context.Context, barberoID, estado string) error
	DesasignarServicio(ctx context.Context, barberoID, servicioID string) error
}
