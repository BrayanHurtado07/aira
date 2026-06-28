package casos_uso

import (
	"context"

	"aira/capacidades/monetizacion/pagos"
	"aira/compartido/errores"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudCobrarSuscripcion struct {
	SuscripcionID string `json:"-"`
	EmpresaID     string `json:"-"`
	CobradoPor    string `json:"-"`
}

type RespuestaCobrarSuscripcion struct {
	PagoID     string  `json:"pago_id"`
	Estado     string  `json:"estado"`
	Monto      float64 `json:"monto"`
	Moneda     string  `json:"moneda"`
	Referencia string  `json:"referencia"`
}

// CasoUsoCobrarSuscripcion orquesta el cobro mensual de una suscripción: deriva el
// monto del plan, cobra vía la pasarela y persiste el comprobante. La política de
// dominio (pertenencia + estado de la suscripción) se valida antes de cobrar.
type CasoUsoCobrarSuscripcion struct {
	repositorio pagos.RepositorioPago
	pasarela    pagos.PasarelaPago
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCobrarSuscripcion(
	repo pagos.RepositorioPago,
	pasarela pagos.PasarelaPago,
	aud auditoria.Auditoria,
) *CasoUsoCobrarSuscripcion {
	return &CasoUsoCobrarSuscripcion{repositorio: repo, pasarela: pasarela, auditoria: aud}
}

func (c *CasoUsoCobrarSuscripcion) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCobrarSuscripcion,
) (RespuestaCobrarSuscripcion, error) {
	datos, err := c.repositorio.ObtenerDatosCobro(ctx, solicitud.SuscripcionID)
	if err != nil {
		return RespuestaCobrarSuscripcion{}, errores.ErrSuscripcionNoExiste
	}
	// Pertenencia de inquilino: una empresa solo cobra sus propias suscripciones
	// (404 implícito, sin revelar existencia ajena).
	if datos.EmpresaID != solicitud.EmpresaID {
		return RespuestaCobrarSuscripcion{}, errores.ErrSuscripcionNoExiste
	}
	if datos.EstadoSuscripcion == "CANCELADA" {
		return RespuestaCobrarSuscripcion{}, errores.ErrSuscripcionCancelada
	}

	resultado, err := c.pasarela.Cobrar(ctx, pagos.SolicitudCobro{
		EmpresaID:     datos.EmpresaID,
		SuscripcionID: datos.SuscripcionID,
		Monto:         datos.Monto,
		Moneda:        datos.Moneda,
		Concepto:      "Suscripción mensual Aira",
	})
	if err != nil {
		return RespuestaCobrarSuscripcion{}, err
	}

	pago, err := c.repositorio.Registrar(ctx, pagos.SolicitudRegistrarPago{
		SuscripcionID:      solicitud.SuscripcionID,
		Estado:             resultado.Estado,
		Pasarela:           c.pasarela.Nombre(),
		ReferenciaPasarela: resultado.ReferenciaPasarela,
		Concepto:           "Suscripción mensual Aira",
		RegistradoPor:      solicitud.CobradoPor,
	})
	if err != nil {
		return RespuestaCobrarSuscripcion{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CobradoPor,
		EmpresaID: datos.EmpresaID,
		Entidad:   "pago_suscripcion",
		EntidadID: pago.ID,
		Accion:    "CREAR",
		Detalle:   map[string]any{"estado": string(resultado.Estado), "monto": pago.Monto, "pasarela": c.pasarela.Nombre()},
	})

	return RespuestaCobrarSuscripcion{
		PagoID:     pago.ID,
		Estado:     string(resultado.Estado),
		Monto:      datos.Monto,
		Moneda:     datos.Moneda,
		Referencia: resultado.ReferenciaPasarela,
	}, nil
}
