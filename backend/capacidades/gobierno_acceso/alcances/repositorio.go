package alcances

import "context"

type RepositorioAlcance interface {
	Asignar(ctx context.Context, alcance Alcance) (string, error)
	Revocar(ctx context.Context, id string) error
	ObtenerActivos(ctx context.Context, usuarioID, empresaID string) ([]Alcance, error)
	ValidarPermiso(ctx context.Context, usuarioID, empresaID, codigoPermiso string) error
	ObtenerNombreRol(ctx context.Context, usuarioID, empresaID string) (string, error)
	BuscarIDRolPorNombre(ctx context.Context, nombre string) (string, error)
}
