package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/monetizacion/planes"
	"aira/capacidades/monetizacion/suscripciones"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RepositorioPlanCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioPlan(pool *pgxpool.Pool) *RepositorioPlanCockroach {
	return &RepositorioPlanCockroach{pool: pool}
}

func (r *RepositorioPlanCockroach) ObtenerActivo(ctx context.Context, id string) (planes.Plan, error) {
	var p planes.Plan
	err := r.pool.QueryRow(ctx,
		`SELECT id_plan, nombre, estado FROM plan WHERE id_plan = $1 AND estado = 'ACTIVO'`,
		id,
	).Scan(&p.ID, &p.Nombre, &p.Estado)
	if err != nil {
		return planes.Plan{}, errores.ErrOperacionFallida
	}
	return p, nil
}

// RepositorioSuscripcionCockroach

type RepositorioSuscripcionCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioSuscripcion(pool *pgxpool.Pool) *RepositorioSuscripcionCockroach {
	return &RepositorioSuscripcionCockroach{pool: pool}
}

func (r *RepositorioSuscripcionCockroach) Activar(
	ctx context.Context,
	s suscripciones.SolicitudActivarSuscripcion,
) (suscripciones.Suscripcion, error) {
	activadoPor := any(s.ActivadoPor)
	if s.ActivadoPor == "" {
		activadoPor = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "suscripcion_activar",
		s.EmpresaID, s.PlanID, s.FechaInicio, s.FechaRenovacion, activadoPor)
	if err != nil {
		return suscripciones.Suscripcion{}, err
	}
	if !resultado.Exito {
		return suscripciones.Suscripcion{}, fmt.Errorf("%s", resultado.Error)
	}

	id := ExtraerCampo(resultado.Datos, "id_suscripcion")
	return suscripciones.Suscripcion{
		ID:              id,
		EmpresaID:       s.EmpresaID,
		PlanID:          s.PlanID,
		FechaInicio:     s.FechaInicio,
		FechaRenovacion: s.FechaRenovacion,
		Estado:          suscripciones.EstadoSuscripcionActiva,
	}, nil
}

func (r *RepositorioSuscripcionCockroach) ObtenerPorID(ctx context.Context, id string) (suscripciones.Suscripcion, error) {
	var s suscripciones.Suscripcion
	err := r.pool.QueryRow(ctx,
		`SELECT id_suscripcion, id_empresa, id_plan, fecha_inicio, fecha_renovacion, estado
		 FROM suscripcion WHERE id_suscripcion = $1`,
		id,
	).Scan(&s.ID, &s.EmpresaID, &s.PlanID, &s.FechaInicio, &s.FechaRenovacion, &s.Estado)
	if err != nil {
		return suscripciones.Suscripcion{}, errores.ErrOperacionFallida
	}
	return s, nil
}

func (r *RepositorioSuscripcionCockroach) Suspender(ctx context.Context, id, suspendidoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "suscripcion_suspender", id, suspendidoPor)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

func (r *RepositorioSuscripcionCockroach) Cancelar(ctx context.Context, id, canceladoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "suscripcion_cancelar", id, canceladoPor)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

// PlanResumen para el selector de planes.
type PlanResumen struct {
	ID     string `json:"id"`
	Nombre string `json:"nombre"`
	Estado string `json:"estado"`
}

// SuscripcionResumen para el listado de suscripciones.
type SuscripcionResumen struct {
	ID              string `json:"id"`
	EmpresaID       string `json:"empresa_id"`
	PlanID          string `json:"plan_id"`
	NombrePlan      string `json:"nombre_plan"`
	Estado          string `json:"estado"`
	FechaInicio     string `json:"fecha_inicio"`
	FechaRenovacion string `json:"fecha_renovacion"`
}

// ListarActivos devuelve todos los planes activos disponibles.
func (r *RepositorioPlanCockroach) ListarActivos(ctx context.Context) ([]PlanResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT id_plan, nombre, estado FROM plan WHERE estado = 'ACTIVO' ORDER BY nombre`,
	)
	if err != nil {
		return nil, fmt.Errorf("listar planes: %w", err)
	}
	defer filas.Close()

	var resultado []PlanResumen
	for filas.Next() {
		var p PlanResumen
		if err := filas.Scan(&p.ID, &p.Nombre, &p.Estado); err != nil {
			return nil, fmt.Errorf("escanear plan: %w", err)
		}
		resultado = append(resultado, p)
	}
	if resultado == nil {
		resultado = []PlanResumen{}
	}
	return resultado, nil
}

// ListarPorEmpresa devuelve las suscripciones de una empresa con nombre del plan.
func (r *RepositorioSuscripcionCockroach) ListarPorEmpresa(ctx context.Context, empresaID string) ([]SuscripcionResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT s.id_suscripcion,
		        s.id_empresa,
		        s.id_plan,
		        COALESCE(p.nombre, 'Plan'),
		        s.estado,
		        s.fecha_inicio::text,
		        s.fecha_renovacion::text
		 FROM suscripcion s
		 LEFT JOIN plan p ON p.id_plan = s.id_plan
		 WHERE s.id_empresa = $1
		 ORDER BY s.fecha_inicio DESC`,
		empresaID,
	)
	if err != nil {
		return nil, fmt.Errorf("listar suscripciones: %w", err)
	}
	defer filas.Close()

	var resultado []SuscripcionResumen
	for filas.Next() {
		var s SuscripcionResumen
		if err := filas.Scan(&s.ID, &s.EmpresaID, &s.PlanID, &s.NombrePlan, &s.Estado, &s.FechaInicio, &s.FechaRenovacion); err != nil {
			return nil, fmt.Errorf("escanear suscripcion: %w", err)
		}
		resultado = append(resultado, s)
	}
	if resultado == nil {
		resultado = []SuscripcionResumen{}
	}
	return resultado, nil
}
