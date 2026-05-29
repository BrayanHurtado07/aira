package contratos

import (
	"context"

	"aira/capacidades/identidad/usuarios"
)

type adaptadorVerificadorIdentidad struct {
	repo usuarios.RepositorioUsuario
}

func NuevoVerificadorIdentidad(repo usuarios.RepositorioUsuario) VerificadorIdentidad {
	return &adaptadorVerificadorIdentidad{repo: repo}
}

func (a *adaptadorVerificadorIdentidad) UsuarioActivo(ctx context.Context, usuarioID string) error {
	usuario, err := a.repo.ObtenerPorID(ctx, usuarioID)
	if err != nil {
		return err
	}
	return usuario.ValidarEstaActivo()
}
