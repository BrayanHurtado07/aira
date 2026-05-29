package alcances

import "aira/compartido/errores"

type EstadoAlcance string

const (
	EstadoAlcanceActivo   EstadoAlcance = "ACTIVO"
	EstadoAlcanceInactivo EstadoAlcance = "INACTIVO"
)

type Alcance struct {
	ID         string
	UsuarioID  string
	EmpresaID  string
	RolID      string
	SucursalID string
	Estado     EstadoAlcance
}

func (a Alcance) ValidarEstaActivo() error {
	if a.Estado != EstadoAlcanceActivo {
		return errores.ErrAlcanceDenegado
	}
	return nil
}
