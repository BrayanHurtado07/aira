package verificaciones

import "context"

// RepositorioVerificacion gestiona los tokens de un solo uso para:
//   - verificar el correo electrónico del usuario
//   - restablecer la contraseña sin autenticación previa
type RepositorioVerificacion interface {
	// CrearToken persiste un hash de verificación válido 60 minutos.
	CrearToken(ctx context.Context, usuarioID, codigoHash string) error

	// VerificarCorreo valida el token y marca correo_verificado = true en usuario.
	// Usa la stored proc usuario_verificar_correo → tiene ese efecto secundario intencional.
	VerificarCorreo(ctx context.Context, usuarioID, codigoHash string) error

	// ValidarYUsarToken valida el token y lo marca como usado,
	// sin tocar correo_verificado. Diseñado para el flujo de restablecimiento de contraseña.
	ValidarYUsarToken(ctx context.Context, usuarioID, codigoHash string) error
}
