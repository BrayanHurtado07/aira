package movimientos

import "context"

// StockSucursal resume el stock de un producto en una sede.
type StockSucursal struct {
	ProductoID     string  `json:"producto_id"`
	SucursalID     string  `json:"sucursal_id"`
	CantidadActual float64 `json:"cantidad_actual"`
	CantidadMinima float64 `json:"cantidad_minima"`
}

type RepositorioMovimientoInventario interface {
	Registrar(ctx context.Context, m MovimientoInventario) (string, error)
	ListarStockPorSucursal(ctx context.Context, sucursalID string) ([]StockSucursal, error)
}
