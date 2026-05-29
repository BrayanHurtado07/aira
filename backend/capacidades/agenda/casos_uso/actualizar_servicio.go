package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/agenda/servicios"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudActualizarServicio struct {
	ServicioID      string  `json:"servicio_id"`
	EmpresaID       string  `json:"-"`
	Nombre          string  `json:"nombre"`
	DuracionMinutos int     `json:"duracion_minutos"`
	Precio          float64 `json:"precio"`
	ActualizadoPor  string  `json:"-"`
}

type CasoUsoActualizarServicio struct {
	repositorio servicios.RepositorioServicio
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActualizarServicio(
	repo servicios.RepositorioServicio,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoActualizarServicio {
	return &CasoUsoActualizarServicio{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoActualizarServicio) Ejecutar(ctx context.Context, s SolicitudActualizarServicio) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.ServicioActualizar); err != nil {
		return err
	}

	servicio, err := c.repositorio.ObtenerActivo(ctx, s.ServicioID)
	if err != nil {
		return errores.ErrServicioNoActivo
	}

	if servicio.EmpresaID != s.EmpresaID {
		return errores.ErrPermisoDenegado
	}

	if err := c.repositorio.ActualizarServicio(ctx, s.ServicioID, s.Nombre, s.DuracionMinutos, s.Precio); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "servicio",
		EntidadID: s.ServicioID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nombre": s.Nombre},
	})

	c.publicador.Publicar(ctx, eventos.ServicioActualizado(s.ServicioID, s.EmpresaID, s.ActualizadoPor))

	return nil
}
