package reservas

import "aira/compartido/errores"

type EstadoReserva string

const (
	EstadoReservaPendiente  EstadoReserva = "PENDIENTE"
	EstadoReservaConfirmada EstadoReserva = "CONFIRMADA"
	EstadoReservaCancelada  EstadoReserva = "CANCELADA"
	EstadoReservaCompletada EstadoReserva = "COMPLETADA"
	EstadoReservaNoAsistio  EstadoReserva = "NO_ASISTIO"
)

type Reserva struct {
	ID              string        `json:"id"`
	EmpresaID       string        `json:"id_empresa"`
	SucursalID      string        `json:"sucursal_id"`
	ClienteID       string        `json:"cliente_id"`
	BarberoID       string        `json:"barbero_id"`
	FechaHoraInicio string        `json:"fecha_hora_inicio"`
	Estado          EstadoReserva `json:"estado"`
	Origen          string        `json:"origen"`
	DisponibilidadID string       `json:"-"`
}

func (r Reserva) ValidarPuedeConfirmarse() error {
	if r.Estado != EstadoReservaPendiente {
		return errores.ErrReservaNoConfirmable
	}
	return nil
}

func (r Reserva) ValidarPuedeCancelarse() error {
	if r.Estado == EstadoReservaCompletada || r.Estado == EstadoReservaCancelada {
		return errores.ErrReservaYaCerrada
	}
	return nil
}

func (r Reserva) ValidarPuedeCompletarse() error {
	if r.Estado != EstadoReservaConfirmada {
		return errores.ErrReservaNoCompletable
	}
	return nil
}

func (r Reserva) ValidarPuedeActualizarse() error {
	if r.Estado != EstadoReservaPendiente && r.Estado != EstadoReservaConfirmada {
		return errores.ErrReservaYaCerrada
	}
	return nil
}
