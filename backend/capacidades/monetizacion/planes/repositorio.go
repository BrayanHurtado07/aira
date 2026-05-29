package planes

import "context"

type RepositorioPlan interface {
	ObtenerActivo(ctx context.Context, id string) (Plan, error)
}
