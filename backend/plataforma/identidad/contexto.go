package identidad

import "context"

type claveContexto string

const claveSesion claveContexto = "sesion_activa"

type ContextoSesion struct {
	SesionID   string
	UsuarioID  string
	EmpresaID  string
	SucursalID string
}

func ConContexto(ctx context.Context, sesion ContextoSesion) context.Context {
	return context.WithValue(ctx, claveSesion, sesion)
}

func SesionDesdeContexto(ctx context.Context) (ContextoSesion, bool) {
	s, ok := ctx.Value(claveSesion).(ContextoSesion)
	return s, ok
}
