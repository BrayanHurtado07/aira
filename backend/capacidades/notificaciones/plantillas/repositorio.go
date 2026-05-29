package plantillas

import "context"

type RepositorioPlantilla interface {
	Guardar(ctx context.Context, plantilla PlantillaMensaje) (string, error)
	ListarPorEmpresa(ctx context.Context, empresaID string) ([]PlantillaMensaje, error)
}
