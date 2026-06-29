package tarifas

// TarifaEspecial define un precio diferencial para un servicio en una sede en una fecha concreta.
type TarifaEspecial struct {
	ID             string  `json:"id"`
	SucursalID     string  `json:"sucursal_id"`
	ServicioID     string  `json:"servicio_id"`
	Fecha          string  `json:"fecha"` // "YYYY-MM-DD"
	PrecioEspecial float64 `json:"precio_especial"`
	Motivo         string  `json:"motivo"`
}
