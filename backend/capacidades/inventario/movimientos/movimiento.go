package movimientos

// MovimientoInventario registra una entrada o salida de stock.
type MovimientoInventario struct {
	ID               string
	ProductoID       string
	SucursalID       string
	ReservaID        string  // opcional
	TipoMovimiento   string  // COMPRA | CONSUMO_SERVICIO | CONSUMO_COMPLEMENTO | AJUSTE | DEVOLUCION
	Cantidad         float64
	CausaDescripcion string
}

// TiposMovimientoValidos define los valores permitidos para TipoMovimiento.
var TiposMovimientoValidos = map[string]bool{
	"COMPRA":              true,
	"CONSUMO_SERVICIO":    true,
	"CONSUMO_COMPLEMENTO": true,
	"AJUSTE":              true,
	"DEVOLUCION":          true,
}
