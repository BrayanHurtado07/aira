package programas

import "context"

type RepositorioPrograma interface {
	Crear(ctx context.Context, empresaID, nombre string, sellosParaRecompensa int, descripcionRecompensa, creadoPor string) (string, error)
}
