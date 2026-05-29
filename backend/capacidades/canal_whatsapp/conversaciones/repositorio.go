package conversaciones

import "context"

type RepositorioConversacion interface {
	Iniciar(ctx context.Context, empresaID, numeroCliente string) (Conversacion, bool, error)
	ObtenerActiva(ctx context.Context, id string) (Conversacion, error)
}
