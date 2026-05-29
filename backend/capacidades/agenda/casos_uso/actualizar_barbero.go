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

type SolicitudActualizarBarbero struct {
	BarberoID      string `json:"barbero_id"`
	EmpresaID      string `json:"-"`
	Nombre         string `json:"nombre"`
	Telefono       string `json:"telefono"`
	ActualizadoPor string `json:"-"`
}

type CasoUsoActualizarBarbero struct {
	repositorio barberos.RepositorioBarbero
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActualizarBarbero(
	repo barberos.RepositorioBarbero,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoActualizarBarbero {
	return &CasoUsoActualizarBarbero{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoActualizarBarbero) Ejecutar(ctx context.Context, s SolicitudActualizarBarbero) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.BarberoActualizar); err != nil {
		return err
	}

	barbero, err := c.repositorio.ObtenerActivo(ctx, s.BarberoID)
	if err != nil {
		return errores.ErrBarberoNoActivo
	}

	if !barbero.PerteneceAEmpresa(s.EmpresaID) {
		return errores.ErrPermisoDenegado
	}

	if err := c.repositorio.ActualizarBarbero(ctx, s.BarberoID, s.Nombre, s.Telefono); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "barbero",
		EntidadID: s.BarberoID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nombre": s.Nombre},
	})

	c.publicador.Publicar(ctx, eventos.BarberoActualizado(s.BarberoID, s.EmpresaID, s.ActualizadoPor))

	return nil
}
