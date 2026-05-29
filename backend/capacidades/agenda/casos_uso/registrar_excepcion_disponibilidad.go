package casos_uso

import (
	"context"

	"aira/capacidades/agenda/excepciones"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudRegistrarExcepcionDisponibilidad struct {
	BarberoID   string `json:"barbero_id"`
	SucursalID  string `json:"sucursal_id"`
	Fecha       string `json:"fecha"`        // "YYYY-MM-DD"
	Motivo      string `json:"motivo"`       // FERIADO | VACACION | CIERRE | OTRO
	Descripcion string `json:"descripcion"`
	CreadoPor   string `json:"-"`
	EmpresaID   string `json:"-"`
}

type RespuestaRegistrarExcepcionDisponibilidad struct {
	ExcepcionID string `json:"excepcion_id"`
}

type CasoUsoRegistrarExcepcionDisponibilidad struct {
	repositorio excepciones.RepositorioExcepcionDisponibilidad
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoRegistrarExcepcionDisponibilidad(
	repo excepciones.RepositorioExcepcionDisponibilidad,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRegistrarExcepcionDisponibilidad {
	return &CasoUsoRegistrarExcepcionDisponibilidad{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoRegistrarExcepcionDisponibilidad) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRegistrarExcepcionDisponibilidad,
) (RespuestaRegistrarExcepcionDisponibilidad, error) {
	if err := c.validador.ValidarPermiso(
		ctx, solicitud.CreadoPor, solicitud.EmpresaID,
		permisos.ExcepcionDisponibilidadRegistrar,
	); err != nil {
		return RespuestaRegistrarExcepcionDisponibilidad{}, err
	}

	if !excepciones.MotivosValidos[solicitud.Motivo] {
		return RespuestaRegistrarExcepcionDisponibilidad{}, errores.ErrMotivoInvalido
	}

	if solicitud.Fecha == "" || solicitud.BarberoID == "" || solicitud.SucursalID == "" {
		return RespuestaRegistrarExcepcionDisponibilidad{}, errores.ErrHorarioInvalido
	}

	excepcion := excepciones.ExcepcionDisponibilidad{
		BarberoID:   solicitud.BarberoID,
		SucursalID:  solicitud.SucursalID,
		Fecha:       solicitud.Fecha,
		Motivo:      solicitud.Motivo,
		Descripcion: solicitud.Descripcion,
	}

	id, err := c.repositorio.Registrar(ctx, excepcion)
	if err != nil {
		return RespuestaRegistrarExcepcionDisponibilidad{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "excepcion_disponibilidad",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"barbero_id": solicitud.BarberoID,
			"fecha":      solicitud.Fecha,
			"motivo":     solicitud.Motivo,
		},
	})

	c.publicador.Publicar(ctx, eventos.ExcepcionDisponibilidadRegistrada(
		id, solicitud.BarberoID, solicitud.SucursalID,
		solicitud.Fecha, solicitud.Motivo, solicitud.CreadoPor,
	))

	return RespuestaRegistrarExcepcionDisponibilidad{ExcepcionID: id}, nil
}
