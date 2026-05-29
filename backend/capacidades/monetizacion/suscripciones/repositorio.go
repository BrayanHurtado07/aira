package suscripciones

import "context"

type SolicitudActivarSuscripcion struct {
	EmpresaID       string
	PlanID          string
	FechaInicio     string
	FechaRenovacion string
	ActivadoPor     string
}

type RepositorioSuscripcion interface {
	Activar(ctx context.Context, solicitud SolicitudActivarSuscripcion) (Suscripcion, error)
	ObtenerPorID(ctx context.Context, id string) (Suscripcion, error)
	Suspender(ctx context.Context, id, suspendidoPor string) error
	Cancelar(ctx context.Context, id, canceladoPor string) error
}
