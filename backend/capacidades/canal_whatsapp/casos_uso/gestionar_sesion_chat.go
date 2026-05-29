package casos_uso

import (
	"context"

	"aira/capacidades/canal_whatsapp/sesion_chat"
)

type SolicitudIniciarSesionChat struct {
	ConversacionID string
	PasoInicial    string
	ContextoJSON   []byte
	MinutosVida    int
}

type RespuestaIniciarSesionChat struct {
	SesionChatID string
	ExpiraEn     string
}

type SolicitudActualizarSesionChat struct {
	SesionChatID string
	PasoActual   string
	ContextoJSON []byte
}

type CasoUsoGestionarSesionChat struct {
	repositorio sesion_chat.RepositorioSesionChat
}

func NuevoCasoUsoGestionarSesionChat(
	repo sesion_chat.RepositorioSesionChat,
) *CasoUsoGestionarSesionChat {
	return &CasoUsoGestionarSesionChat{repositorio: repo}
}

func (c *CasoUsoGestionarSesionChat) Iniciar(
	ctx context.Context,
	solicitud SolicitudIniciarSesionChat,
) (RespuestaIniciarSesionChat, error) {
	minutos := solicitud.MinutosVida
	if minutos <= 0 {
		minutos = 30
	}

	sesion, err := c.repositorio.Iniciar(ctx, sesion_chat.SolicitudIniciarSesionChat{
		ConversacionID: solicitud.ConversacionID,
		PasoInicial:    solicitud.PasoInicial,
		ContextoJSON:   solicitud.ContextoJSON,
		MinutosVida:    minutos,
	})
	if err != nil {
		return RespuestaIniciarSesionChat{}, err
	}

	return RespuestaIniciarSesionChat{
		SesionChatID: sesion.ID,
		ExpiraEn:     sesion.ExpiraEn,
	}, nil
}

func (c *CasoUsoGestionarSesionChat) Actualizar(
	ctx context.Context,
	solicitud SolicitudActualizarSesionChat,
) error {
	return c.repositorio.Actualizar(ctx, sesion_chat.SolicitudActualizarSesionChat{
		SesionChatID: solicitud.SesionChatID,
		PasoActual:   solicitud.PasoActual,
		ContextoJSON: solicitud.ContextoJSON,
	})
}
