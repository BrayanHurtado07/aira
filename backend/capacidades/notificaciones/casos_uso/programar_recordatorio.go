package casos_uso

import (
	"context"

	"aira/capacidades/notificaciones/recordatorios"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudProgramarRecordatorio struct {
	ReservaID string
	EnviarEn  string
	Canal     string
	EmpresaID string
	CreadoPor string
}

type RespuestaProgramarRecordatorio struct {
	RecordatorioID string
}

type CasoUsoProgramarRecordatorio struct {
	repositorio recordatorios.RepositorioRecordatorio
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoProgramarRecordatorio(
	repo recordatorios.RepositorioRecordatorio,
	aud auditoria.Auditoria,
) *CasoUsoProgramarRecordatorio {
	return &CasoUsoProgramarRecordatorio{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoProgramarRecordatorio) Ejecutar(
	ctx context.Context,
	solicitud SolicitudProgramarRecordatorio,
) (RespuestaProgramarRecordatorio, error) {
	id, err := c.repositorio.Programar(ctx,
		solicitud.ReservaID,
		solicitud.EnviarEn,
		solicitud.Canal,
		solicitud.CreadoPor,
	)
	if err != nil {
		return RespuestaProgramarRecordatorio{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "recordatorio_programado",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"canal": solicitud.Canal, "enviar_en": solicitud.EnviarEn},
	})

	return RespuestaProgramarRecordatorio{RecordatorioID: id}, nil
}
