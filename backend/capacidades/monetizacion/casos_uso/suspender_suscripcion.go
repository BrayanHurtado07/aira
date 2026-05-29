package casos_uso

import (
	"context"

	"aira/capacidades/monetizacion/suscripciones"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoSuspenderSuscripcion struct {
	repositorio suscripciones.RepositorioSuscripcion
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoSuspenderSuscripcion(
	repo suscripciones.RepositorioSuscripcion,
	aud auditoria.Auditoria,
) *CasoUsoSuspenderSuscripcion {
	return &CasoUsoSuspenderSuscripcion{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoSuspenderSuscripcion) Ejecutar(
	ctx context.Context,
	suscripcionID, suspendidoPor, empresaID string,
) error {
	suscripcion, err := c.repositorio.ObtenerPorID(ctx, suscripcionID)
	if err != nil {
		return err
	}

	if err := suscripcion.ValidarPuedeSuspenderse(); err != nil {
		return err
	}

	if err := c.repositorio.Suspender(ctx, suscripcionID, suspendidoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: suspendidoPor,
		EmpresaID: empresaID,
		Entidad:   "suscripcion",
		EntidadID: suscripcionID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nuevo_estado": "SUSPENDIDA"},
	})

	return nil
}
