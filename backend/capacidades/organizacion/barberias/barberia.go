package barberias

import "aira/compartido/errores"

type EstadoEmpresa string

const (
	EstadoEmpresaActivo   EstadoEmpresa = "ACTIVO"
	EstadoEmpresaInactivo EstadoEmpresa = "INACTIVO"
)

type Empresa struct {
	ID     string
	Nombre string
	Estado EstadoEmpresa
}

func (e Empresa) ValidarEstaActiva() error {
	if e.Estado != EstadoEmpresaActivo {
		return errores.ErrEmpresaNoActiva
	}
	return nil
}
