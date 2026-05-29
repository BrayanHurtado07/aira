package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/reservas"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoConfirmarReserva struct {
	repositorio reservas.RepositorioReserva
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoConfirmarReserva(
	repo reservas.RepositorioReserva,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoConfirmarReserva {
	return &CasoUsoConfirmarReserva{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoConfirmarReserva) Ejecutar(
	ctx context.Context,
	reservaID, confirmadoPor, empresaID string,
) error {
	if err := c.validador.ValidarPermiso(ctx, confirmadoPor, empresaID, permisos.ReservaConfirmar); err != nil {
		return err
	}

	reserva, err := c.repositorio.ObtenerPorID(ctx, reservaID)
	if err != nil {
		return err
	}

	if err := reserva.ValidarPuedeConfirmarse(); err != nil {
		return err
	}

	if err := c.repositorio.Confirmar(ctx, reservaID, confirmadoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: confirmadoPor,
		EmpresaID: empresaID,
		Entidad:   "reserva",
		EntidadID: reservaID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nuevo_estado": "CONFIRMADA"},
	})

	c.publicador.Publicar(ctx, eventos.ReservaConfirmada(reservaID, reserva.ClienteID, reserva.BarberoID, confirmadoPor))

	return nil
}
