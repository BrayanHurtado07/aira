package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/monetizacion/pagos"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RepositorioPagoCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioPago(pool *pgxpool.Pool) *RepositorioPagoCockroach {
	return &RepositorioPagoCockroach{pool: pool}
}

// ObtenerDatosCobro deriva el monto/moneda del plan vigente de la suscripción.
func (r *RepositorioPagoCockroach) ObtenerDatosCobro(ctx context.Context, suscripcionID string) (pagos.DatosCobro, error) {
	var d pagos.DatosCobro
	d.SuscripcionID = suscripcionID
	err := r.pool.QueryRow(ctx,
		`SELECT s.id_empresa, s.estado, p.precio_mensual, p.moneda_plan
		 FROM suscripcion s JOIN plan p ON p.id_plan = s.id_plan
		 WHERE s.id_suscripcion = $1`,
		suscripcionID,
	).Scan(&d.EmpresaID, &d.EstadoSuscripcion, &d.Monto, &d.Moneda)
	if err != nil {
		return pagos.DatosCobro{}, err
	}
	return d, nil
}

func (r *RepositorioPagoCockroach) Registrar(ctx context.Context, s pagos.SolicitudRegistrarPago) (pagos.Pago, error) {
	registradoPor := any(s.RegistradoPor)
	if s.RegistradoPor == "" {
		registradoPor = nil
	}
	referencia := any(s.ReferenciaPasarela)
	if s.ReferenciaPasarela == "" {
		referencia = nil
	}

	// Firma: pago_registrar(p_id_suscripcion, p_estado, p_pasarela, p_referencia_pasarela, p_concepto, p_registrado_por)
	resultado, err := LlamarProc(ctx, r.pool, "pago_registrar",
		s.SuscripcionID, string(s.Estado), s.Pasarela, referencia, s.Concepto, registradoPor)
	if err != nil {
		return pagos.Pago{}, err
	}
	if !resultado.Exito {
		return pagos.Pago{}, fmt.Errorf("%s", resultado.Error)
	}
	return pagos.Pago{ID: ExtraerCampo(resultado.Datos, "id_pago")}, nil
}
