package barberos

import "aira/compartido/errores"

type EstadoBarbero string

const (
	EstadoBarberoActivo   EstadoBarbero = "ACTIVO"
	EstadoBarberoInactivo EstadoBarbero = "INACTIVO"
)

type Barbero struct {
	ID        string        `json:"id"`
	EmpresaID string        `json:"id_empresa"`
	Nombre    string        `json:"nombre"`
	Telefono  string        `json:"telefono,omitempty"`
	UsuarioID string        `json:"usuario_id,omitempty"`
	Estado    EstadoBarbero `json:"estado"`
}

func (b Barbero) ValidarEstaActivo() error {
	if b.Estado != EstadoBarberoActivo {
		return errores.ErrBarberoNoActivo
	}
	return nil
}

func (b Barbero) PerteneceAEmpresa(empresaID string) bool {
	return b.EmpresaID == empresaID
}
