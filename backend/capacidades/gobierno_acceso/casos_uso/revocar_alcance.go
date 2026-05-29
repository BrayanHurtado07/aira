package casos_uso

import (
	"context"

	"aira/capacidades/gobierno_acceso/alcances"
	"aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoRevocarAlcance struct {
	repositorio alcances.RepositorioAlcance
	validador   contratos.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoRevocarAlcance(
	repo alcances.RepositorioAlcance,
	val contratos.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRevocarAlcance {
	return &CasoUsoRevocarAlcance{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoRevocarAlcance) Ejecutar(
	ctx context.Context,
	alcanceID, revocadoPor, empresaID string,
) error {
	if err := c.validador.ValidarPermiso(ctx, revocadoPor, empresaID, permisos.AlcanceRevocar); err != nil {
		return err
	}

	if err := c.repositorio.Revocar(ctx, alcanceID); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: revocadoPor,
		EmpresaID: empresaID,
		Entidad:   "alcance",
		EntidadID: alcanceID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nuevo_estado": "INACTIVO"},
	})

	c.publicador.Publicar(ctx, eventos.AlcanceRevocado(alcanceID, revocadoPor, empresaID))

	return nil
}
