package periodos

import "aira/compartido/errores"

type EstadoPeriodo string

const (
	EstadoPeriodoActivo EstadoPeriodo = "ACTIVO"
	EstadoPeriodoCerrado EstadoPeriodo = "CERRADO"
)

type Periodo struct {
	ID          string
	EmpresaID   string
	Nombre      string
	FechaInicio string
	FechaFin    string
	Estado      EstadoPeriodo
}

func (p Periodo) ValidarEstaAbierto() error {
	if p.Estado != EstadoPeriodoActivo {
		return errores.ErrPeriodoNoAbierto
	}
	return nil
}

func (p Periodo) ValidarPuedeCerrarse() error {
	if p.Estado == EstadoPeriodoCerrado {
		return errores.ErrPeriodoYaCerrado
	}
	return nil
}
