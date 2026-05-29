package casos_uso

import (
	"context"

	"aira/capacidades/canal_whatsapp/conversaciones"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudIniciarConversacion struct {
	EmpresaID     string
	NumeroCliente string
	CreadoPor     string
}

type RespuestaIniciarConversacion struct {
	ConversacionID    string
	NuevaConversacion bool
}

type CasoUsoIniciarConversacion struct {
	repositorio conversaciones.RepositorioConversacion
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoIniciarConversacion(
	repo conversaciones.RepositorioConversacion,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoIniciarConversacion {
	return &CasoUsoIniciarConversacion{repositorio: repo, publicador: pub, auditoria: aud}
}

func (c *CasoUsoIniciarConversacion) Ejecutar(
	ctx context.Context,
	solicitud SolicitudIniciarConversacion,
) (RespuestaIniciarConversacion, error) {
	conversacion, esNueva, err := c.repositorio.Iniciar(ctx, solicitud.EmpresaID, solicitud.NumeroCliente)
	if err != nil {
		return RespuestaIniciarConversacion{}, err
	}

	if esNueva {
		c.auditoria.Registrar(ctx, auditoria.Evento{
			UsuarioID: solicitud.CreadoPor,
			EmpresaID: solicitud.EmpresaID,
			Entidad:   "conversacion",
			EntidadID: conversacion.ID,
			Accion:    "CREAR",
			Detalle:   map[string]any{"numero_cliente": solicitud.NumeroCliente},
		})
		c.publicador.Publicar(ctx, eventos.ConversacionAbierta(conversacion.ID, solicitud.EmpresaID, solicitud.NumeroCliente))
	}

	return RespuestaIniciarConversacion{
		ConversacionID:    conversacion.ID,
		NuevaConversacion: esNueva,
	}, nil
}
