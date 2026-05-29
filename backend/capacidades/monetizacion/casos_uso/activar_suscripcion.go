package casos_uso

import (
	"context"

	"aira/capacidades/monetizacion/suscripciones"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudActivarSuscripcion struct {
	EmpresaID       string `json:"empresa_id"`
	PlanID          string `json:"plan_id"`
	FechaInicio     string `json:"fecha_inicio"`
	FechaRenovacion string `json:"fecha_renovacion"`
	ActivadoPor     string `json:"-"`
}

type RespuestaActivarSuscripcion struct {
	SuscripcionID string
}

type CasoUsoActivarSuscripcion struct {
	repositorio suscripciones.RepositorioSuscripcion
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActivarSuscripcion(
	repo suscripciones.RepositorioSuscripcion,
	aud auditoria.Auditoria,
) *CasoUsoActivarSuscripcion {
	return &CasoUsoActivarSuscripcion{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoActivarSuscripcion) Ejecutar(
	ctx context.Context,
	solicitud SolicitudActivarSuscripcion,
) (RespuestaActivarSuscripcion, error) {
	suscripcion, err := c.repositorio.Activar(ctx, suscripciones.SolicitudActivarSuscripcion{
		EmpresaID:       solicitud.EmpresaID,
		PlanID:          solicitud.PlanID,
		FechaInicio:     solicitud.FechaInicio,
		FechaRenovacion: solicitud.FechaRenovacion,
		ActivadoPor:     solicitud.ActivadoPor,
	})
	if err != nil {
		return RespuestaActivarSuscripcion{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.ActivadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "suscripcion",
		EntidadID: suscripcion.ID,
		Accion:    "CREAR",
		Detalle:   map[string]any{"id_plan": solicitud.PlanID, "fecha_renovacion": solicitud.FechaRenovacion},
	})

	return RespuestaActivarSuscripcion{SuscripcionID: suscripcion.ID}, nil
}
