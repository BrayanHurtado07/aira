package casos_uso

import (
	"context"

	"aira/capacidades/agenda/disponibilidad"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudRegistrarDisponibilidad struct {
	BarberoID  string `json:"barbero_id"`
	SucursalID string `json:"sucursal_id"`
	DiaSemana  int    `json:"dia_semana"`
	HoraInicio string `json:"hora_inicio"`
	HoraFin    string `json:"hora_fin"`
	CreadoPor  string `json:"-"`
	EmpresaID  string `json:"-"`
}

type RespuestaRegistrarDisponibilidad struct {
	DisponibilidadID string
}

type CasoUsoRegistrarDisponibilidad struct {
	repositorio disponibilidad.RepositorioDisponibilidad
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoRegistrarDisponibilidad(
	repo disponibilidad.RepositorioDisponibilidad,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRegistrarDisponibilidad {
	return &CasoUsoRegistrarDisponibilidad{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoRegistrarDisponibilidad) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRegistrarDisponibilidad,
) (RespuestaRegistrarDisponibilidad, error) {
	if err := c.validador.ValidarPermiso(ctx, solicitud.CreadoPor, solicitud.EmpresaID, permisos.DisponibilidadCrear); err != nil {
		return RespuestaRegistrarDisponibilidad{}, err
	}

	bloque := disponibilidad.BloqueDisponibilidad{
		BarberoID:  solicitud.BarberoID,
		SucursalID: solicitud.SucursalID,
		DiaSemana:  solicitud.DiaSemana,
		HoraInicio: solicitud.HoraInicio,
		HoraFin:    solicitud.HoraFin,
	}

	id, err := c.repositorio.Registrar(ctx, bloque)
	if err != nil {
		return RespuestaRegistrarDisponibilidad{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "disponibilidad",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"id_barbero": solicitud.BarberoID,
			"dia_semana": solicitud.DiaSemana,
		},
	})

	c.publicador.Publicar(ctx, eventos.DisponibilidadCreada(id, solicitud.BarberoID, solicitud.SucursalID, solicitud.CreadoPor))

	return RespuestaRegistrarDisponibilidad{DisponibilidadID: id}, nil
}
