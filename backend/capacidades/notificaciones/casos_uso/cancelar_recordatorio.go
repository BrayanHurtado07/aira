package casos_uso

import (
	"context"

	"aira/capacidades/notificaciones/recordatorios"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoCancelarRecordatorio struct {
	repositorio recordatorios.RepositorioRecordatorio
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCancelarRecordatorio(
	repo recordatorios.RepositorioRecordatorio,
	aud auditoria.Auditoria,
) *CasoUsoCancelarRecordatorio {
	return &CasoUsoCancelarRecordatorio{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoCancelarRecordatorio) Ejecutar(
	ctx context.Context,
	recordatorioID, canceladoPor, empresaID string,
) error {
	recordatorio, err := c.repositorio.ObtenerPorID(ctx, recordatorioID)
	if err != nil {
		return err
	}

	if err := recordatorio.ValidarPuedeCancelarse(); err != nil {
		return err
	}

	if err := c.repositorio.Cancelar(ctx, recordatorioID, canceladoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: canceladoPor,
		EmpresaID: empresaID,
		Entidad:   "recordatorio_programado",
		EntidadID: recordatorioID,
		Accion:    "CANCELAR",
	})

	return nil
}
