package clientes

import "aira/compartido/errores"

type EstadoCliente string

const (
	EstadoClienteActivo   EstadoCliente = "ACTIVO"
	EstadoClienteInactivo EstadoCliente = "INACTIVO"
	EstadoClienteBloqueado EstadoCliente = "BLOQUEADO"
)

type Cliente struct {
	ID        string        `json:"id"`
	EmpresaID string        `json:"id_empresa"`
	Nombre    string        `json:"nombre"`
	Telefono  string        `json:"telefono"`
	Correo    string        `json:"correo,omitempty"`
	Estado    EstadoCliente `json:"estado"`
}

func (c Cliente) ValidarEstaActivo() error {
	if c.Estado != EstadoClienteActivo {
		return errores.ErrClienteNoOperativo
	}
	return nil
}
