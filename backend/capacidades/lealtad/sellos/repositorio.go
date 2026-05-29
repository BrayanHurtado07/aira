package sellos

import "context"

type RepositorioSello interface {
	Acumular(ctx context.Context, empresaID, clienteID, reservaID, registradoPor string) (string, error)
	Anular(ctx context.Context, selloID, motivoAnulacion, anuladoPor string) error
	AplicarCanje(ctx context.Context, tarjetaID, reservaID string, sellosAUsar int, descripcion, creadoPor string) (string, error)
}
