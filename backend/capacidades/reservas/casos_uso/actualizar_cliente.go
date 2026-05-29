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

type SolicitudActualizarCliente struct {
	ClienteID      string `json:"cliente_id"`
	EmpresaID      string `json:"-"`
	Nombre         string `json:"nombre"`
	Telefono       string `json:"telefono"`
	Correo         string `json:"correo_electronico"`
	ActualizadoPor string `json:"-"`
}

type CasoUsoActualizarCliente struct {
	repositorio clientes.RepositorioCliente
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActualizarCliente(
	repo clientes.RepositorioCliente,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoActualizarCliente {
	return &CasoUsoActualizarCliente{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoActualizarCliente) Ejecutar(ctx context.Context, s SolicitudActualizarCliente) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.ClienteActualizar); err != nil {
		return err
	}

	cliente, err := c.repositorio.ObtenerActivo(ctx, s.ClienteID)
	if err != nil {
		return errores.ErrClienteNoExiste
	}

	if cliente.EmpresaID != s.EmpresaID {
		return errores.ErrPermisoDenegado
	}

	if err := c.repositorio.ActualizarCliente(ctx, s.ClienteID, s.Nombre, s.Telefono, s.Correo); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "cliente",
		EntidadID: s.ClienteID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nombre": s.Nombre},
	})

	c.publicador.Publicar(ctx, eventos.ClienteActualizado(s.ClienteID, s.EmpresaID, s.ActualizadoPor))

	return nil
}
