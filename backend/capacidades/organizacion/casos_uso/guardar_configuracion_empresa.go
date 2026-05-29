package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/organizacion/barberias"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudGuardarConfiguracionEmpresa struct {
	EmpresaID                    string `json:"-"`
	HorasAnticipacionCancelacion int    `json:"horas_anticipacion_cancelacion"`
	DiasMaxReservaAnticipada     int    `json:"dias_max_reserva_anticipada"`
	HorasRecordatorioReserva     int    `json:"horas_recordatorio_reserva"`
	PermiteReservaMismoDia       bool   `json:"permite_reserva_mismo_dia"`
	RequiereConfirmacionManual   bool   `json:"requiere_confirmacion_manual"`
	ActualizadoPor               string `json:"-"`
}

type CasoUsoGuardarConfiguracionEmpresa struct {
	repositorio barberias.RepositorioEmpresa
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoGuardarConfiguracionEmpresa(
	repo barberias.RepositorioEmpresa,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoGuardarConfiguracionEmpresa {
	return &CasoUsoGuardarConfiguracionEmpresa{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoGuardarConfiguracionEmpresa) Ejecutar(ctx context.Context, s SolicitudGuardarConfiguracionEmpresa) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.ConfiguracionGestionar); err != nil {
		return err
	}

	if s.HorasAnticipacionCancelacion < 0 {
		return errores.ErrConfiguracionCampoInvalido
	}
	if s.DiasMaxReservaAnticipada <= 0 {
		return errores.ErrConfiguracionCampoInvalido
	}
	if s.HorasRecordatorioReserva < 0 {
		return errores.ErrConfiguracionCampoInvalido
	}

	config := barberias.ConfiguracionEmpresa{
		EmpresaID:                    s.EmpresaID,
		HorasAnticipacionCancelacion: s.HorasAnticipacionCancelacion,
		DiasMaxReservaAnticipada:     s.DiasMaxReservaAnticipada,
		HorasRecordatorioReserva:     s.HorasRecordatorioReserva,
		PermiteReservaMismoDia:       s.PermiteReservaMismoDia,
		RequiereConfirmacionManual:   s.RequiereConfirmacionManual,
	}

	if err := c.repositorio.GuardarConfiguracion(ctx, config, s.ActualizadoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "empresa",
		EntidadID: s.EmpresaID,
		Accion:    "GUARDAR_CONFIGURACION",
		Detalle: map[string]any{
			"horas_anticipacion_cancelacion": s.HorasAnticipacionCancelacion,
			"dias_max_reserva_anticipada":    s.DiasMaxReservaAnticipada,
			"horas_recordatorio_reserva":     s.HorasRecordatorioReserva,
			"permite_reserva_mismo_dia":      s.PermiteReservaMismoDia,
			"requiere_confirmacion_manual":   s.RequiereConfirmacionManual,
		},
	})

	c.publicador.Publicar(ctx, eventos.ConfiguracionEmpresaActualizada(s.EmpresaID, s.ActualizadoPor))

	return nil
}
