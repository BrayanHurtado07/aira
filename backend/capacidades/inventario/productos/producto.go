package productos

// Producto es un insumo o consumible que usa la barbería.
type Producto struct {
	ID             string
	EmpresaID      string
	Nombre         string
	Codigo         string
	Tipo           string  // INSUMO_BARBERO | CONSUMIBLE_CLIENTE
	PrecioUnitario float64
	Descripcion    string
	Estado         string
}

// TiposValidos define los valores permitidos para Tipo.
var TiposValidos = map[string]bool{
	"INSUMO_BARBERO":     true,
	"CONSUMIBLE_CLIENTE": true,
}
