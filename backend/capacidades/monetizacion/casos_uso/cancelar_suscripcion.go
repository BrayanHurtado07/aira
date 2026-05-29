package casos_uso

import (
	"context"

	"aira/capacidades/monetizacion/suscripciones"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoCancelarSuscripcion struct {
	repositorio suscripciones.RepositorioSuscripcion
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCancelarSuscripcion(
	repo suscripciones.RepositorioSuscripcion,
	aud auditoria.Auditoria,
) *CasoUsoCancelarSuscripcion {
	return &CasoUsoCancelarSuscripcion{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoCancelarSuscripcion) Ejecutar(
	ctx context.Context,
	suscripcionID, canceladoPor, empresaID string,
) error {
	suscripcion, err := c.repositorio.ObtenerPorID(ctx, suscripcionID)
	if err != nil {
		return err
	}

	if err := suscripcion.ValidarPuedeCancelarse(); err != nil {
		return err
	}

	if err := c.repositorio.Cancelar(ctx, suscripcionID, canceladoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: canceladoPor,
		EmpresaID: empresaID,
		Entidad:   "suscripcion",
		EntidadID: suscripcionID,
		Accion:    "CANCELAR",
	})

	return nil
}
