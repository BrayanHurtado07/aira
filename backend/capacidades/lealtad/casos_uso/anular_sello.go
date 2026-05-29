package casos_uso

import (
	"context"

	"aira/capacidades/lealtad/sellos"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoAnularSello struct {
	repositorio sellos.RepositorioSello
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoAnularSello(
	repo sellos.RepositorioSello,
	aud auditoria.Auditoria,
) *CasoUsoAnularSello {
	return &CasoUsoAnularSello{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoAnularSello) Ejecutar(
	ctx context.Context,
	selloID, motivoAnulacion, anuladoPor, empresaID string,
) error {
	if err := c.repositorio.Anular(ctx, selloID, motivoAnulacion, anuladoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: anuladoPor,
		EmpresaID: empresaID,
		Entidad:   "sello",
		EntidadID: selloID,
		Accion:    "ANULAR",
		Detalle:   map[string]any{"motivo": motivoAnulacion},
	})

	return nil
}
