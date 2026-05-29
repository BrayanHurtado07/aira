package sedes

import "context"

type RepositorioSucursal interface {
	ObtenerActiva(ctx context.Context, id string) (Sucursal, error)
	Guardar(ctx context.Context, sucursal Sucursal) (string, error)
	ListarActivas(ctx context.Context, empresaID string) ([]Sucursal, error)
	ActualizarEstadoSucursal(ctx context.Context, sucursalID, estado string) error
}
