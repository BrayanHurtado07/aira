package excepciones

import "context"

type RepositorioExcepcionDisponibilidad interface {
	Registrar(ctx context.Context, e ExcepcionDisponibilidad) (string, error)
	ListarPorBarbero(ctx context.Context, barberoID string) ([]ExcepcionDisponibilidad, error)
	Eliminar(ctx context.Context, excepcionID string) error
}
