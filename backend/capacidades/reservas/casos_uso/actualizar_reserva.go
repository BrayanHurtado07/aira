package casos_uso

import (
	"context"

	"aira/capacidades/reservas"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudActualizarReserva struct {
	ReservaID       string `json:"reserva_id"`
	EmpresaID       string `json:"-"`
	ClienteID       string `json:"cliente_id"`
	BarberoID       string `json:"barbero_id"`
	ServicioID      string `json:"servicio_id"`
	FechaHoraInicio string `json:"fecha_hora_inicio"`
	Origen          string `json:"origen"`
	ActualizadoPor  string `json:"-"`
}

type CasoUsoActualizarReserva struct {
	repositorio reservas.RepositorioReserva
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoActualizarReserva(
	repo reservas.RepositorioReserva,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoActualizarReserva {
	return &CasoUsoActualizarReserva{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoActualizarReserva) Ejecutar(ctx context.Context, s SolicitudActualizarReserva) error {
	if err := c.validador.ValidarPermiso(ctx, s.ActualizadoPor, s.EmpresaID, permisos.ReservaActualizar); err != nil {
		return err
	}

	reserva, err := c.repositorio.ObtenerPorID(ctx, s.ReservaID)
	if err != nil {
		return errores.ErrReservaNoExiste
	}

	if reserva.EmpresaID != s.EmpresaID {
		return errores.ErrPermisoDenegado
	}

	if err := reserva.ValidarPuedeActualizarse(); err != nil {
		return err
	}

	if err := c.repositorio.ActualizarReserva(ctx, s.ReservaID, s.ClienteID, s.BarberoID, s.ServicioID, s.FechaHoraInicio, s.Origen); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ActualizadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "reserva",
		EntidadID: s.ReservaID,
		Accion:    "ACTUALIZAR",
		Detalle: map[string]any{
			"cliente_id":        s.ClienteID,
			"barbero_id":        s.BarberoID,
			"fecha_hora_inicio": s.FechaHoraInicio,
		},
	})

	c.publicador.Publicar(ctx, eventos.ReservaActualizada(s.ReservaID, s.EmpresaID, s.ActualizadoPor))

	return nil
}
