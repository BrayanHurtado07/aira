package activacion

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ControlPorPlan verifica que una empresa tenga una suscripción activa
// y que su plan incluya la capacidad solicitada.
type ControlPorPlan struct {
	pool *pgxpool.Pool
}

func NuevoControlPorPlan(pool *pgxpool.Pool) *ControlPorPlan {
	return &ControlPorPlan{pool: pool}
}

// CapacidadHabilitada devuelve nil si la empresa tiene suscripcion ACTIVA.
// Fase siguiente (Fase 11) añadirá verificación de plan_limite por capacidad.
func (c *ControlPorPlan) CapacidadHabilitada(ctx context.Context, empresaID string) error {
	var existe bool
	err := c.pool.QueryRow(ctx,
		`SELECT EXISTS (
			SELECT 1 FROM suscripcion
			WHERE id_empresa = $1 AND estado = 'ACTIVA'
		)`,
		empresaID,
	).Scan(&existe)
	if err != nil {
		return fmt.Errorf("verificar_plan: %w", err)
	}
	if !existe {
		return fmt.Errorf("empresa_sin_suscripcion_activa")
	}
	return nil
}
