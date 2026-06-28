package productos

// Producto es un insumo o consumible que usa la barbería.
type Producto struct {
	ID             string  `json:"id"`
	EmpresaID      string  `json:"empresa_id"`
	Nombre         string  `json:"nombre"`
	Codigo         string  `json:"codigo"`
	Tipo           string  `json:"tipo"` // INSUMO_BARBERO | CONSUMIBLE_CLIENTE
	PrecioUnitario float64 `json:"precio_unitario"`
	Descripcion    string  `json:"descripcion"`
	Estado         string  `json:"estado"`
}

// TiposValidos define los valores permitidos para Tipo.
var TiposValidos = map[string]bool{
	"INSUMO_BARBERO":     true,
	"CONSUMIBLE_CLIENTE": true,
}
