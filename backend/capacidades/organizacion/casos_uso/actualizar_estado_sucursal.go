package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/organizacion/sedes"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudActualizarEstadoSucursal struct {
	SucursalID     string `json:"sucursal_id"`
	EmpresaID      string `json:"-"`
	Estado         string `json:"estado"`
	ActualizadoPor string `json:"-"`
}

type CasoUsoActualizarEstadoSucursal struct {
	repositorio sedes.RepositorioSucursal
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActualizarEstadoSucursal(
	repo sedes.RepositorioSucursal,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoActualizarEstadoSucursal {
	return &CasoUsoActualizarEstadoSucursal{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoActualizarEstadoSucursal) Ejecutar(ctx context.Context, s SolicitudActualizarEstadoSucursal) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.SedeCrear); err != nil {
		return err
	}

	estadosValidos := map[string]bool{
		string(sedes.EstadoSucursalActiva):   true,
		string(sedes.EstadoSucursalInactiva): true,
	}
	if !estadosValidos[s.Estado] {
		return errores.ErrOperacionFallida
	}

	if err := c.repositorio.ActualizarEstadoSucursal(ctx, s.SucursalID, s.Estado); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "sucursal",
		EntidadID: s.SucursalID,
		Accion:    "CAMBIAR_ESTADO",
		Detalle:   map[string]any{"estado": s.Estado},
	})

	c.publicador.Publicar(ctx, eventos.SucursalEstadoCambiado(s.SucursalID, s.EmpresaID, s.Estado, s.ActualizadoPor))

	return nil
}
