package sesion_chat

import "context"

type SolicitudIniciarSesionChat struct {
	ConversacionID string
	PasoInicial    string
	ContextoJSON   []byte
	MinutosVida    int
}

type SolicitudActualizarSesionChat struct {
	SesionChatID string
	PasoActual   string
	ContextoJSON []byte
}

type RepositorioSesionChat interface {
	Iniciar(ctx context.Context, solicitud SolicitudIniciarSesionChat) (SesionChat, error)
	Actualizar(ctx context.Context, solicitud SolicitudActualizarSesionChat) error
	ObtenerPorConversacion(ctx context.Context, conversacionID string) (SesionChat, error)
}
