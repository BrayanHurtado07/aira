package casos_uso

import (
	"context"

	"aira/capacidades/gobierno_acceso/alcances"
	"aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	contratosIdentidad "aira/capacidades/identidad/contratos"
	contratosOrg "aira/capacidades/organizacion/contratos"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudAsignarAlcance struct {
	UsuarioID   string
	EmpresaID   string
	RolID       string
	SucursalID  string
	AsignadoPor string
}

type RespuestaAsignarAlcance struct {
	AlcanceID string
}

type CasoUsoAsignarAlcance struct {
	repositorio          alcances.RepositorioAlcance
	validador            contratos.ValidadorPermiso
	verificadorIdentidad contratosIdentidad.VerificadorIdentidad
	contexto             contratosOrg.ValidadorContextoCoherente
	publicador           eventos.PublicadorEventos
	auditoria            auditoria.Auditoria
}

func NuevoCasoUsoAsignarAlcance(
	repo alcances.RepositorioAlcance,
	val contratos.ValidadorPermiso,
	verif contratosIdentidad.VerificadorIdentidad,
	ctx_ contratosOrg.ValidadorContextoCoherente,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoAsignarAlcance {
	return &CasoUsoAsignarAlcance{
		repositorio:          repo,
		validador:            val,
		verificadorIdentidad: verif,
		contexto:             ctx_,
		publicador:           pub,
		auditoria:            aud,
	}
}

func (c *CasoUsoAsignarAlcance) Ejecutar(
	ctx context.Context,
	solicitud SolicitudAsignarAlcance,
) (RespuestaAsignarAlcance, error) {
	if err := c.validador.ValidarPermiso(ctx, solicitud.AsignadoPor, solicitud.EmpresaID, permisos.AlcanceAsignar); err != nil {
		return RespuestaAsignarAlcance{}, err
	}

	if err := c.verificadorIdentidad.UsuarioActivo(ctx, solicitud.UsuarioID); err != nil {
		return RespuestaAsignarAlcance{}, err
	}

	if err := c.contexto.ValidarContexto(ctx, solicitud.EmpresaID, solicitud.SucursalID, ""); err != nil {
		return RespuestaAsignarAlcance{}, err
	}

	alcance := alcances.Alcance{
		UsuarioID:  solicitud.UsuarioID,
		EmpresaID:  solicitud.EmpresaID,
		RolID:      solicitud.RolID,
		SucursalID: solicitud.SucursalID,
		Estado:     alcances.EstadoAlcanceActivo,
	}

	id, err := c.repositorio.Asignar(ctx, alcance)
	if err != nil {
		return RespuestaAsignarAlcance{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.AsignadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "alcance",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"id_usuario": solicitud.UsuarioID,
			"id_rol":     solicitud.RolID,
		},
	})

	c.publicador.Publicar(ctx, eventos.AlcanceAsignado(id, solicitud.UsuarioID, solicitud.EmpresaID, solicitud.RolID, solicitud.AsignadoPor))

	return RespuestaAsignarAlcance{AlcanceID: id}, nil
}
