package contratos

import (
	"context"

	"aira/capacidades/gobierno_acceso/alcances"
)

type adaptadorValidadorPermiso struct {
	repo alcances.RepositorioAlcance
}

func NuevoValidadorPermiso(repo alcances.RepositorioAlcance) ValidadorPermiso {
	return &adaptadorValidadorPermiso{repo: repo}
}

func (a *adaptadorValidadorPermiso) ValidarPermiso(ctx context.Context, usuarioID, empresaID, codigoPermiso string) error {
	return a.repo.ValidarPermiso(ctx, usuarioID, empresaID, codigoPermiso)
}
