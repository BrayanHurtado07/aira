package pagos

import (
	"context"
	"log"
	"os"

	dominio "aira/capacidades/monetizacion/pagos"
)

// PasarelaSimulada es la implementación de desarrollo: aprueba todo cobro y deja
// rastro en el log. Permite probar el flujo de monetización end-to-end sin un
// proveedor real. En producción se reemplaza por una pasarela real (Culqi, Stripe,
// MercadoPago) detrás de la misma interfaz dominio.PasarelaPago.
type PasarelaSimulada struct{}

func (PasarelaSimulada) Nombre() string { return "SIMULADA" }

func (PasarelaSimulada) Cobrar(_ context.Context, s dominio.SolicitudCobro) (dominio.ResultadoCobro, error) {
	log.Printf("[pago] SIMULADA → cobrando %.2f %s a empresa=%s (suscripción %s): %q",
		s.Monto, s.Moneda, s.EmpresaID, s.SuscripcionID, s.Concepto)
	return dominio.ResultadoCobro{
		Estado:             dominio.EstadoPagoAprobado,
		ReferenciaPasarela: "SIM-" + s.SuscripcionID,
	}, nil
}

// NuevaPasarela elige la implementación según configuración. Hoy solo existe la
// simulada; cuando se integre un proveedor real, se selecciona aquí por la env
// PASARELA_PAGO_PROVEEDOR (p. ej. "culqi") y sus credenciales, sin tocar el dominio.
func NuevaPasarela() dominio.PasarelaPago {
	switch os.Getenv("PASARELA_PAGO_PROVEEDOR") {
	default:
		return PasarelaSimulada{}
	}
}
