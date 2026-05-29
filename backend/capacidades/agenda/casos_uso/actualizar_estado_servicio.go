package casos_uso

import (
	"context"

	"aira/capacidades/agenda/servicios"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudActualizarEstadoServicio struct {
	ServicioID     string `json:"servicio_id"`
	EmpresaID      string `json:"-"`
	Estado         string `json:"estado"`
	ActualizadoPor string `json:"-"`
}

type CasoUsoActualizarEstadoServicio struct {
	repositorio servicios.RepositorioServicio
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActualizarEstadoServicio(
	repo servicios.RepositorioServicio,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoActualizarEstadoServicio {
	return &CasoUsoActualizarEstadoServicio{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoActualizarEstadoServicio) Ejecutar(ctx context.Context, s SolicitudActualizarEstadoServicio) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.ServicioActualizar); err != nil {
		return err
	}

	estadosValidos := map[string]bool{
		string(servicios.EstadoServicioActivo):   true,
		string(servicios.EstadoServicioInactivo): true,
	}
	if !estadosValidos[s.Estado] {
		return errores.ErrOperacionFallida
	}

	if err := c.repositorio.ActualizarEstadoServicio(ctx, s.ServicioID, s.Estado); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "servicio",
		EntidadID: s.ServicioID,
		Accion:    "CAMBIAR_ESTADO",
		Detalle:   map[string]any{"estado": s.Estado},
	})

	c.publicador.Publicar(ctx, eventos.ServicioEstadoCambiado(s.ServicioID, s.EmpresaID, s.Estado, s.ActualizadoPor))

	return nil
}
