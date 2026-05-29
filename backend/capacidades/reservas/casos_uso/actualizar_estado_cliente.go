package casos_uso

import (
	"context"

	"aira/capacidades/reservas/clientes"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudActualizarEstadoCliente struct {
	ClienteID      string `json:"cliente_id"`
	EmpresaID      string `json:"-"`
	Estado         string `json:"estado"`
	ActualizadoPor string `json:"-"`
}

type CasoUsoActualizarEstadoCliente struct {
	repositorio clientes.RepositorioCliente
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActualizarEstadoCliente(
	repo clientes.RepositorioCliente,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoActualizarEstadoCliente {
	return &CasoUsoActualizarEstadoCliente{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoActualizarEstadoCliente) Ejecutar(ctx context.Context, s SolicitudActualizarEstadoCliente) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.ClienteActualizar); err != nil {
		return err
	}

	estadosValidos := map[string]bool{
		string(clientes.EstadoClienteActivo):    true,
		string(clientes.EstadoClienteInactivo):  true,
		string(clientes.EstadoClienteBloqueado): true,
	}
	if !estadosValidos[s.Estado] {
		return errores.ErrOperacionFallida
	}

	if err := c.repositorio.ActualizarEstadoCliente(ctx, s.ClienteID, s.Estado); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "cliente",
		EntidadID: s.ClienteID,
		Accion:    "CAMBIAR_ESTADO",
		Detalle:   map[string]any{"estado": s.Estado},
	})

	c.publicador.Publicar(ctx, eventos.ClienteEstadoCambiado(s.ClienteID, s.EmpresaID, s.Estado, s.ActualizadoPor))

	return nil
}
