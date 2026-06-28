package pagos

import "context"

type EstadoPago string

const (
	EstadoPagoPendiente EstadoPago = "PENDIENTE"
	EstadoPagoAprobado  EstadoPago = "APROBADO"
	EstadoPagoRechazado EstadoPago = "RECHAZADO"
)

// SolicitudCobro es lo que se le pide a la pasarela para cobrar una suscripción.
type SolicitudCobro struct {
	EmpresaID     string
	SuscripcionID string
	Monto         float64
	Moneda        string
	Concepto      string
}

// ResultadoCobro es lo que devuelve la pasarela tras intentar el cobro.
type ResultadoCobro struct {
	Estado             EstadoPago
	ReferenciaPasarela string
}

// PasarelaPago es el puerto de salida hacia el proveedor de pagos (Culqi, Stripe,
// MercadoPago…). La implementación real vive en la plataforma y se elige por
// configuración; el dominio solo conoce este contrato.
type PasarelaPago interface {
	Nombre() string
	Cobrar(ctx context.Context, solicitud SolicitudCobro) (ResultadoCobro, error)
}

// DatosCobro son los datos de facturación derivados de la suscripción y su plan.
type DatosCobro struct {
	SuscripcionID     string
	EmpresaID         string
	Monto             float64
	Moneda            string
	EstadoSuscripcion string
}

// SolicitudRegistrarPago persiste el resultado de un cobro.
type SolicitudRegistrarPago struct {
	SuscripcionID      string
	Estado             EstadoPago
	Pasarela           string
	ReferenciaPasarela string
	Concepto           string
	RegistradoPor      string
}

// Pago es el comprobante persistido.
type Pago struct {
	ID     string
	Monto  float64
	Moneda string
}

// RepositorioPago es el puerto de persistencia de cobros.
type RepositorioPago interface {
	ObtenerDatosCobro(ctx context.Context, suscripcionID string) (DatosCobro, error)
	Registrar(ctx context.Context, solicitud SolicitudRegistrarPago) (Pago, error)
}
