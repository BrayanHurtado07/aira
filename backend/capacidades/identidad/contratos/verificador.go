package contratos

import "context"

// VerificadorIdentidad es el contrato que Identidad expone hacia capacidades
// que necesitan verificar si un usuario existe y está activo.
type VerificadorIdentidad interface {
	UsuarioActivo(ctx context.Context, usuarioID string) error
}
