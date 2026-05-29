package orquestacion

import (
	"context"

	"aira/capacidades/gobierno_acceso/alcances"
	"aira/compartido/errores"
)

// SolicitudAutorizacion agrupa los datos necesarios para verificar si
// un usuario puede ejecutar una operación en un contexto dado.
type SolicitudAutorizacion struct {
	UsuarioID      string
	EmpresaID      string
	CodigoPermiso  string
}

// GuardiaPoliticas verifica permiso + alcance antes de ejecutar cualquier operacion.
// El manejador la invoca; nunca el caso de uso.
type GuardiaPoliticas struct {
	alcances alcances.RepositorioAlcance
}

func NuevaGuardiaPoliticas(repo alcances.RepositorioAlcance) *GuardiaPoliticas {
	return &GuardiaPoliticas{alcances: repo}
}

// PuedeEjecutar valida en cadena: alcance activo → permiso requerido.
// Si cualquier regla falla, retorna el error de dominio correspondiente.
func (g *GuardiaPoliticas) PuedeEjecutar(
	ctx context.Context,
	solicitud SolicitudAutorizacion,
) error {
	activos, err := g.alcances.ObtenerActivos(ctx, solicitud.UsuarioID, solicitud.EmpresaID)
	if err != nil || len(activos) == 0 {
		return errores.ErrAlcanceDenegado
	}

	if solicitud.CodigoPermiso == "" {
		return nil
	}

	if err := g.alcances.ValidarPermiso(ctx,
		solicitud.UsuarioID,
		solicitud.EmpresaID,
		solicitud.CodigoPermiso,
	); err != nil {
		return errores.ErrPermisoDenegado
	}

	return nil
}
