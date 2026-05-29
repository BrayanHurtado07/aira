package contratos

import "context"

// ValidadorPermiso es el contrato que Gobierno de Acceso expone hacia capacidades
// que necesitan verificar si un usuario tiene permiso para una operación.
type ValidadorPermiso interface {
	ValidarPermiso(ctx context.Context, usuarioID, empresaID, codigoPermiso string) error
}
