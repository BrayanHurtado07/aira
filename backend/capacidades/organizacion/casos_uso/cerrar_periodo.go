package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/organizacion/periodos"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoCerrarPeriodo struct {
	repositorio periodos.RepositorioPeriodo
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCerrarPeriodo(
	repo periodos.RepositorioPeriodo,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCerrarPeriodo {
	return &CasoUsoCerrarPeriodo{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCerrarPeriodo) Ejecutar(
	ctx context.Context,
	periodoID, cerradoPor, empresaID string,
) error {
	if err := c.validador.ValidarPermiso(ctx, cerradoPor, empresaID, permisos.PeriodoCerrar); err != nil {
		return err
	}

	periodo, err := c.repositorio.ObtenerActivo(ctx, periodoID)
	if err != nil {
		return err
	}

	if err := periodo.ValidarPuedeCerrarse(); err != nil {
		return err
	}

	if err := c.repositorio.Cerrar(ctx, periodoID); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: cerradoPor,
		EmpresaID: empresaID,
		Entidad:   "periodo",
		EntidadID: periodoID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nuevo_estado": "CERRADO"},
	})

	c.publicador.Publicar(ctx, eventos.PeriodoCerrado(periodoID, empresaID, cerradoPor))

	return nil
}
