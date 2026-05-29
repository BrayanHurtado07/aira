package casos_uso

import (
	"context"

	"aira/capacidades/canal_whatsapp/conversaciones"
)

type SolicitudRegistrarMensaje struct {
	ConversacionID string
	Contenido      string
	Tipo           string
	Direccion      string
	IDExternoWA    string
	EstadoEntrega  string
}

type RespuestaRegistrarMensaje struct {
	MensajeID string
}

type RepositorioMensaje interface {
	Guardar(ctx context.Context, solicitud SolicitudRegistrarMensaje) (string, error)
}

type CasoUsoRegistrarMensaje struct {
	conversaciones conversaciones.RepositorioConversacion
	mensajes       RepositorioMensaje
}

func NuevoCasoUsoRegistrarMensaje(
	conv conversaciones.RepositorioConversacion,
	mens RepositorioMensaje,
) *CasoUsoRegistrarMensaje {
	return &CasoUsoRegistrarMensaje{conversaciones: conv, mensajes: mens}
}

func (c *CasoUsoRegistrarMensaje) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRegistrarMensaje,
) (RespuestaRegistrarMensaje, error) {
	conversacion, err := c.conversaciones.ObtenerActiva(ctx, solicitud.ConversacionID)
	if err != nil {
		return RespuestaRegistrarMensaje{}, err
	}

	if err := conversacion.ValidarEstaActiva(); err != nil {
		return RespuestaRegistrarMensaje{}, err
	}

	id, err := c.mensajes.Guardar(ctx, solicitud)
	if err != nil {
		return RespuestaRegistrarMensaje{}, err
	}

	return RespuestaRegistrarMensaje{MensajeID: id}, nil
}
