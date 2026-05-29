package suscripciones

import "aira/compartido/errores"

type EstadoSuscripcion string

const (
	EstadoSuscripcionActiva    EstadoSuscripcion = "ACTIVA"
	EstadoSuscripcionSuspendida EstadoSuscripcion = "SUSPENDIDA"
	EstadoSuscripcionCancelada EstadoSuscripcion = "CANCELADA"
)

type Suscripcion struct {
	ID             string
	EmpresaID      string
	PlanID         string
	FechaInicio    string
	FechaRenovacion string
	Estado         EstadoSuscripcion
}

func (s Suscripcion) ValidarPuedeSuspenderse() error {
	if s.Estado != EstadoSuscripcionActiva {
		return errores.ErrOperacionFallida
	}
	return nil
}

func (s Suscripcion) ValidarPuedeCancelarse() error {
	if s.Estado == EstadoSuscripcionCancelada {
		return errores.ErrOperacionFallida
	}
	return nil
}
