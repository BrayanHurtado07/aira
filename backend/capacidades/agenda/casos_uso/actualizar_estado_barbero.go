package casos_uso

import (
	"context"

	"aira/capacidades/agenda/barberos"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudActualizarEstadoBarbero struct {
	BarberoID      string `json:"barbero_id"`
	EmpresaID      string `json:"-"`
	Estado         string `json:"estado"`
	ActualizadoPor string `json:"-"`
}

type CasoUsoActualizarEstadoBarbero struct {
	repositorio barberos.RepositorioBarbero
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActualizarEstadoBarbero(
	repo barberos.RepositorioBarbero,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoActualizarEstadoBarbero {
	return &CasoUsoActualizarEstadoBarbero{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoActualizarEstadoBarbero) Ejecutar(ctx context.Context, s SolicitudActualizarEstadoBarbero) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.BarberoActualizar); err != nil {
		return err
	}

	estadosValidos := map[string]bool{
		string(barberos.EstadoBarberoActivo):   true,
		string(barberos.EstadoBarberoInactivo): true,
	}
	if !estadosValidos[s.Estado] {
		return errores.ErrOperacionFallida
	}

	if err := c.repositorio.ActualizarEstadoBarbero(ctx, s.BarberoID, s.Estado); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "barbero",
		EntidadID: s.BarberoID,
		Accion:    "CAMBIAR_ESTADO",
		Detalle:   map[string]any{"estado": s.Estado},
	})

	c.publicador.Publicar(ctx, eventos.BarberoEstadoCambiado(s.BarberoID, s.EmpresaID, s.Estado, s.ActualizadoPor))

	return nil
}
