package usuarios

import "aira/compartido/errores"

type EstadoUsuario string

const (
	EstadoUsuarioActivo   EstadoUsuario = "ACTIVO"
	EstadoUsuarioInactivo EstadoUsuario = "INACTIVO"
	EstadoUsuarioEliminado EstadoUsuario = "ELIMINADO"
)

type Usuario struct {
	ID           string
	Nombre       string
	Correo       string
	HashPassword string
	Estado       EstadoUsuario
	Verificado   bool
}

func (u Usuario) ValidarPuedeAutenticarse() error {
	if u.Estado != EstadoUsuarioActivo {
		return errores.ErrIdentidadNoActiva
	}
	if !u.Verificado {
		return errores.ErrIdentidadNoVerificada
	}
	return nil
}

func (u Usuario) ValidarEstaActivo() error {
	if u.Estado != EstadoUsuarioActivo {
		return errores.ErrIdentidadNoActiva
	}
	return nil
}
