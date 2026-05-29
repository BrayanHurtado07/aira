package tarifas

// TarifaEspecial define un precio diferencial para un servicio en una sede en una fecha concreta.
type TarifaEspecial struct {
	ID            string
	SucursalID    string
	ServicioID    string
	Fecha         string  // "YYYY-MM-DD"
	PrecioEspecial float64
	Motivo        string
}
