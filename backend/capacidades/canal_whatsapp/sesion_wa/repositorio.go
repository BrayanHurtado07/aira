package sesion_wa

import "context"

type RepositorioSesionWhatsApp interface {
	ObtenerConectada(ctx context.Context, empresaID string) (SesionWhatsApp, error)
}
