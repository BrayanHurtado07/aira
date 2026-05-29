package usuarios

import "context"

type RepositorioUsuario interface {
	ObtenerPorCorreo(ctx context.Context, correo string) (Usuario, error)
	ObtenerPorID(ctx context.Context, id string) (Usuario, error)
	Guardar(ctx context.Context, usuario Usuario, hashPassword string) (string, error)
	CambiarPassword(ctx context.Context, id, hashPassword string) error
	Inactivar(ctx context.Context, id string) error
	ObtenerPrimeraEmpresaActiva(ctx context.Context, usuarioID string) (string, error)
}
