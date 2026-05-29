package tarifas

import "context"

type RepositorioTarifaEspecial interface {
	Crear(ctx context.Context, t TarifaEspecial, creadoPor string) (string, error)
	ListarPorSucursal(ctx context.Context, sucursalID string) ([]TarifaEspecial, error)
	Eliminar(ctx context.Context, tarifaID string) error
}
