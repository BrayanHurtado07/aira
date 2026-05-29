package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/reservas"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoCompletarReserva struct {
	repositorio reservas.RepositorioReserva
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCompletarReserva(
	repo reservas.RepositorioReserva,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCompletarReserva {
	return &CasoUsoCompletarReserva{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCompletarReserva) Ejecutar(
	ctx context.Context,
	reservaID, completadoPor, empresaID string,
) error {
	if err := c.validador.ValidarPermiso(ctx, completadoPor, empresaID, permisos.ReservaCompletar); err != nil {
		return err
	}

	reserva, err := c.repositorio.ObtenerPorID(ctx, reservaID)
	if err != nil {
		return err
	}

	if err := reserva.ValidarPuedeCompletarse(); err != nil {
		return err
	}

	if err := c.repositorio.Completar(ctx, reservaID, completadoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: completadoPor,
		EmpresaID: empresaID,
		Entidad:   "reserva",
		EntidadID: reservaID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nuevo_estado": "COMPLETADA"},
	})

	c.publicador.Publicar(ctx, eventos.ReservaCompletada(reservaID, reserva.ClienteID, completadoPor))

	return nil
}
