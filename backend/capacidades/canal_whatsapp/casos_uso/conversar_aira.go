package casos_uso

import (
	"context"
	"fmt"
	"strings"

	"aira/capacidades/canal_whatsapp/aira"
)

// SolicitudConversarAira es un mensaje entrante del cliente (de WhatsApp o, en
// dev, del endpoint de simulación).
type SolicitudConversarAira struct {
	EmpresaID     string
	NumeroCliente string
	Texto         string
}

type RespuestaConversarAira struct {
	Respuesta      string `json:"respuesta"`
	Intencion      string `json:"intencion"`
	Interprete     string `json:"interprete"`
	ConversacionID string `json:"conversacion_id"`
}

// CasoUsoConversarAira es el cerebro+orquestador de Aira IA: interpreta el mensaje
// del cliente, actúa vía atender_chat y responde, persistiendo la conversación.
type CasoUsoConversarAira struct {
	iniciarConversacion *CasoUsoIniciarConversacion
	registrarMensaje    *CasoUsoRegistrarMensaje
	atenderChat         *CasoUsoAtenderChat
	interprete          aira.InterpreteIA
	flujoAgenda         *FlujoAgenda
}

func NuevoCasoUsoConversarAira(
	iniciar *CasoUsoIniciarConversacion,
	registrar *CasoUsoRegistrarMensaje,
	atender *CasoUsoAtenderChat,
	interprete aira.InterpreteIA,
	flujoAgenda *FlujoAgenda,
) *CasoUsoConversarAira {
	return &CasoUsoConversarAira{
		iniciarConversacion: iniciar,
		registrarMensaje:    registrar,
		atenderChat:         atender,
		interprete:          interprete,
		flujoAgenda:         flujoAgenda,
	}
}

func (c *CasoUsoConversarAira) Ejecutar(ctx context.Context, s SolicitudConversarAira) (RespuestaConversarAira, error) {
	// 1. Abrir o reutilizar la conversación con este número.
	conv, err := c.iniciarConversacion.Ejecutar(ctx, SolicitudIniciarConversacion{
		EmpresaID:     s.EmpresaID,
		NumeroCliente: s.NumeroCliente,
	})
	if err != nil {
		return RespuestaConversarAira{}, err
	}

	// 2. Registrar el mensaje entrante.
	if _, err := c.registrarMensaje.Ejecutar(ctx, SolicitudRegistrarMensaje{
		ConversacionID: conv.ConversacionID,
		Contenido:      s.Texto,
		Tipo:           "TEXTO",
		Direccion:      "ENTRADA",
	}); err != nil {
		return RespuestaConversarAira{}, err
	}

	// 3. El cerebro interpreta la intención.
	intencion, err := c.interprete.Interpretar(ctx, s.Texto)
	if err != nil {
		return RespuestaConversarAira{}, err
	}

	// 4. Si hay una reserva en curso, o el cliente quiere agendar, lo lleva el
	//    flujo de agendamiento (máquina de estados). Si no, respuesta simple.
	var respuesta string
	if c.flujoAgenda.PasoActivo(ctx, conv.ConversacionID) != "" || intencion.Tipo == aira.IntencionAgendar {
		respuesta = c.flujoAgenda.Manejar(ctx, conv.ConversacionID, s.EmpresaID, s.NumeroCliente, s.Texto)
	} else {
		respuesta = c.responder(ctx, s.EmpresaID, intencion)
	}

	// 5. Registrar la respuesta saliente.
	_, _ = c.registrarMensaje.Ejecutar(ctx, SolicitudRegistrarMensaje{
		ConversacionID: conv.ConversacionID,
		Contenido:      respuesta,
		Tipo:           "TEXTO",
		Direccion:      "SALIDA",
	})

	return RespuestaConversarAira{
		Respuesta:      respuesta,
		Intencion:      string(intencion.Tipo),
		Interprete:     c.interprete.Nombre(),
		ConversacionID: conv.ConversacionID,
	}, nil
}

func (c *CasoUsoConversarAira) responder(ctx context.Context, empresaID string, intencion aira.Intencion) string {
	switch intencion.Tipo {
	case aira.IntencionSaludar:
		return "¡Hola! Soy Aira, tu asistente de la barbería 💈 Puedo mostrarte nuestras sedes, consultar disponibilidad o agendar un corte. ¿Qué necesitas?"

	case aira.IntencionListarSedes:
		resp, err := c.atenderChat.ListarSedes(ctx, empresaID)
		if err != nil || len(resp.Sedes) == 0 {
			return "Por ahora no tengo sedes disponibles para mostrarte."
		}
		var b strings.Builder
		b.WriteString("Estas son nuestras sedes:\n")
		for _, s := range resp.Sedes {
			b.WriteString(fmt.Sprintf("• %s\n", s.Nombre))
		}
		b.WriteString("¿En cuál te gustaría agendar?")
		return b.String()

	case aira.IntencionDisponibilidad:
		return "Con gusto reviso la disponibilidad. ¿En qué sede y para qué fecha quieres tu corte?"

	case aira.IntencionAgendar:
		return "¡Perfecto, te ayudo a agendar! Cuéntame: ¿en qué sede, qué servicio (corte, barba, fade) y para cuándo?"

	case aira.IntencionDespedir:
		return "¡Gracias por escribir! Te esperamos en la barbería 💈"

	default:
		return "Disculpa, no te entendí bien 🙏 Puedo mostrarte las sedes, consultar disponibilidad o agendar un corte. ¿Qué prefieres?"
	}
}
