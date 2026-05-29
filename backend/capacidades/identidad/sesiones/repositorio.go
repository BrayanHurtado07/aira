package sesiones

import "context"

// SesionGlobal refleja solo las columnas reales de la tabla sesion_global.
// EmpresaID y SucursalID NO viven en la tabla — viajan en el JWT.
type SesionGlobal struct {
	ID        string
	UsuarioID string
	TokenHash string
	Estado    string
	ExpiraEn  string
}

type SolicitudGuardarSesion struct {
	UsuarioID   string
	TokenHash   string
	RefreshHash string
	IPOrigen    string
	UserAgent   string
	MinutosVida int
}

type RepositorioSesion interface {
	Guardar(ctx context.Context, solicitud SolicitudGuardarSesion) (SesionGlobal, error)
	ActualizarHashes(ctx context.Context, sesionID, tokenHash, refreshHash string) error
	ObtenerPorTokenHash(ctx context.Context, hash string) (SesionGlobal, error)
	ObtenerPorRefreshHash(ctx context.Context, hash string) (SesionGlobal, error)
	Revocar(ctx context.Context, id string) error
	// InvalidarPorUsuario invalida todas las sesiones activas de un usuario.
	// Retorna la cantidad de sesiones invalidadas. Se usa como política gatillo.
	InvalidarPorUsuario(ctx context.Context, usuarioID string) (int, error)
}
