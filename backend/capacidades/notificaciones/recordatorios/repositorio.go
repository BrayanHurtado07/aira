package recordatorios

import "context"

type RepositorioRecordatorio interface {
	Programar(ctx context.Context, reservaID, enviarEn, canal, creadoPor string) (string, error)
	ObtenerPorID(ctx context.Context, id string) (Recordatorio, error)
	Cancelar(ctx context.Context, id, canceladoPor string) error
}
