package sedes

import "aira/compartido/errores"

type EstadoSucursal string

const (
	EstadoSucursalActiva   EstadoSucursal = "ACTIVO"
	EstadoSucursalInactiva EstadoSucursal = "INACTIVO"
)

type Sucursal struct {
	ID        string         `json:"id"`
	EmpresaID string         `json:"id_empresa"`
	Nombre    string         `json:"nombre"`
	Direccion string         `json:"direccion,omitempty"`
	Estado    EstadoSucursal `json:"estado"`
}

func (s Sucursal) ValidarEstaActiva() error {
	if s.Estado != EstadoSucursalActiva {
		return errores.ErrSucursalNoActiva
	}
	return nil
}

func (s Sucursal) PerteneceAEmpresa(empresaID string) bool {
	return s.EmpresaID == empresaID
}
