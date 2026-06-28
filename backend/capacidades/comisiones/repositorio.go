package comisiones

import "context"

// Comision es una comisión generada por una reserva completada (lectura).
type Comision struct {
	ID            string `json:"id"`
	BarberoID     string `json:"barbero_id"`
	BarberoNombre string `json:"barbero_nombre"`
	ReservaID     string `json:"reserva_id"`
	MontoCalculado string `json:"monto_calculado"`
	Estado        string `json:"estado"`
	GeneradoEn    string `json:"generado_en"`
}

// Liquidacion es el pago agrupado de comisiones de un barbero en un periodo (lectura).
type Liquidacion struct {
	ID            string `json:"id"`
	BarberoID     string `json:"barbero_id"`
	BarberoNombre string `json:"barbero_nombre"`
	FechaInicio   string `json:"fecha_inicio"`
	FechaFin      string `json:"fecha_fin"`
	MontoTotal    string `json:"monto_total"`
	Frecuencia    string `json:"frecuencia"`
	Estado        string `json:"estado"`
}

// RepositorioComision agrupa la persistencia de esquemas, comisiones y liquidaciones.
type RepositorioComision interface {
	CrearEsquema(ctx context.Context, empresaID, nombre, tipo string, sueldoBase, porcentaje float64, descripcion, creadoPor string) (string, error)
	GenerarComision(ctx context.Context, reservaID, generadoPor string) (string, error)
	CalcularLiquidacion(ctx context.Context, empresaID, barberoID, fechaInicio, fechaFin, frecuencia, calculadoPor string) (string, error)
	AprobarLiquidacion(ctx context.Context, liquidacionID, aprobadoPor string) error
	PagarLiquidacion(ctx context.Context, liquidacionID, pagadoPor string) error
	ListarComisiones(ctx context.Context, empresaID, barberoID, desde, hasta string) ([]Comision, error)
	ListarLiquidaciones(ctx context.Context, empresaID string) ([]Liquidacion, error)
}
