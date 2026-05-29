package productos

import "context"

type RepositorioProducto interface {
	Crear(ctx context.Context, p Producto) (string, error)
	ObtenerActivo(ctx context.Context, id string) (Producto, error)
	ListarPorEmpresa(ctx context.Context, empresaID string) ([]Producto, error)
}
