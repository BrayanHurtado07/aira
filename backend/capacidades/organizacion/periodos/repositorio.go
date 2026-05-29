package periodos

import "context"

type RepositorioPeriodo interface {
	ObtenerActivo(ctx context.Context, id string) (Periodo, error)
	Guardar(ctx context.Context, periodo Periodo) (string, error)
	Cerrar(ctx context.Context, id string) error
}
