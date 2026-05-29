package casos_uso

import (
	"context"

	contratosAgenda "aira/capacidades/agenda/contratos"
	"aira/capacidades/reservas"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudRegistrarReserva struct {
	EmpresaID        string `json:"empresa_id"`
	SucursalID       string `json:"sucursal_id"`
	ClienteID        string `json:"cliente_id"`
	BarberoID        string `json:"barbero_id"`
	ServicioID       string `json:"servicio_id"`
	FechaHoraInicio  string `json:"fecha_hora_inicio"`
	Origen           string `json:"origen"`
	CreadoPor        string `json:"-"`
	DisponibilidadID string `json:"disponibilidad_id"` // opcional: si se reserva sobre un bloque específico
}

type RespuestaRegistrarReserva struct {
	ReservaID string
	Estado    string
}

type CasoUsoRegistrarReserva struct {
	repositorio          reservas.RepositorioReserva
	gestorDisponibilidad contratosAgenda.GestorDisponibilidad
	publicador           eventos.PublicadorEventos
	auditoria            auditoria.Auditoria
}

func NuevoCasoUsoRegistrarReserva(
	repo reservas.RepositorioReserva,
	gestor contratosAgenda.GestorDisponibilidad,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRegistrarReserva {
	return &CasoUsoRegistrarReserva{
		repositorio:          repo,
		gestorDisponibilidad: gestor,
		publicador:           pub,
		auditoria:            aud,
	}
}

func (c *CasoUsoRegistrarReserva) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRegistrarReserva,
) (RespuestaRegistrarReserva, error) {
	if solicitud.DisponibilidadID != "" {
		if _, err := c.gestorDisponibilidad.ObtenerLibre(ctx, solicitud.DisponibilidadID); err != nil {
			return RespuestaRegistrarReserva{}, err
		}
	}

	// La validación completa de dominio ocurre dentro del stored proc reserva_crear.
	reserva, err := c.repositorio.Guardar(ctx, reservas.SolicitudGuardarReserva{
		EmpresaID:        solicitud.EmpresaID,
		SucursalID:       solicitud.SucursalID,
		ClienteID:        solicitud.ClienteID,
		BarberoID:        solicitud.BarberoID,
		ServicioID:       solicitud.ServicioID,
		FechaHoraInicio:  solicitud.FechaHoraInicio,
		Origen:           solicitud.Origen,
		CreadoPor:        solicitud.CreadoPor,
		DisponibilidadID: solicitud.DisponibilidadID,
	})
	if err != nil {
		return RespuestaRegistrarReserva{}, err
	}

	if solicitud.DisponibilidadID != "" {
		_ = c.gestorDisponibilidad.MarcarReservada(ctx, solicitud.DisponibilidadID)
		c.publicador.Publicar(ctx, eventos.DisponibilidadMarcadaReservada(solicitud.DisponibilidadID, reserva.ID))
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "reserva",
		EntidadID: reserva.ID,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"id_cliente": solicitud.ClienteID,
			"id_barbero": solicitud.BarberoID,
			"origen":     solicitud.Origen,
		},
	})

	c.publicador.Publicar(ctx, eventos.ReservaCreada(reserva.ID, solicitud.ClienteID, solicitud.BarberoID, solicitud.SucursalID, solicitud.Origen))

	return RespuestaRegistrarReserva{ReservaID: reserva.ID, Estado: string(reserva.Estado)}, nil
}
