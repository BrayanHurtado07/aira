package servicios

import "context"

type RepositorioServicio interface {
	ObtenerActivo(ctx context.Context, id string) (Servicio, error)
	Guardar(ctx context.Context, servicio Servicio) (string, error)
	ActualizarServicio(ctx context.Context, servicioID, nombre string, duracionMinutos int, precio float64) error
	ActualizarEstadoServicio(ctx context.Context, servicioID, estado string) error
}
