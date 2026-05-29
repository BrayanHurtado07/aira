package casos_uso

import (
	"context"

	contratosAgenda "aira/capacidades/agenda/contratos"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/reservas"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoCancelarReserva struct {
	repositorio          reservas.RepositorioReserva
	gestorDisponibilidad contratosAgenda.GestorDisponibilidad
	validador            contratosGobierno.ValidadorPermiso
	publicador           eventos.PublicadorEventos
	auditoria            auditoria.Auditoria
}

func NuevoCasoUsoCancelarReserva(
	repo reservas.RepositorioReserva,
	gestor contratosAgenda.GestorDisponibilidad,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCancelarReserva {
	return &CasoUsoCancelarReserva{
		repositorio:          repo,
		gestorDisponibilidad: gestor,
		validador:            val,
		publicador:           pub,
		auditoria:            aud,
	}
}

func (c *CasoUsoCancelarReserva) Ejecutar(
	ctx context.Context,
	reservaID, canceladoPor, empresaID string,
) error {
	if err := c.validador.ValidarPermiso(ctx, canceladoPor, empresaID, permisos.ReservaCancelar); err != nil {
		return err
	}

	reserva, err := c.repositorio.ObtenerPorID(ctx, reservaID)
	if err != nil {
		return err
	}

	if err := reserva.ValidarPuedeCancelarse(); err != nil {
		return err
	}

	if err := c.repositorio.Cancelar(ctx, reservaID, canceladoPor); err != nil {
		return err
	}

	if reserva.DisponibilidadID != "" {
		_ = c.gestorDisponibilidad.LiberarBloque(ctx, reserva.DisponibilidadID)
		c.publicador.Publicar(ctx, eventos.DisponibilidadLiberada(reserva.DisponibilidadID, reservaID))
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: canceladoPor,
		EmpresaID: empresaID,
		Entidad:   "reserva",
		EntidadID: reservaID,
		Accion:    "CANCELAR",
		Detalle:   map[string]any{"cancelado_por": canceladoPor},
	})

	c.publicador.Publicar(ctx, eventos.ReservaCancelada(reservaID, reserva.ClienteID, canceladoPor))

	return nil
}
