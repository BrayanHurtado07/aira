package tablero

import "context"

type RepositorioTablero interface {
	ObtenerMetricas(ctx context.Context, s SolicitudMetricasTablero) (MetricasTablero, error)
}
