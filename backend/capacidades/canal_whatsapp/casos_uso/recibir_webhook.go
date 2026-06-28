package casos_uso

import "context"

// ResolutorEmpresaWA traduce el número de teléfono de Meta (phone_number_id) a la
// empresa dueña de esa línea de WhatsApp.
type ResolutorEmpresaWA interface {
	ResolverEmpresaPorNumeroMeta(ctx context.Context, idNumeroTelefonoMeta string) (string, error)
}

// DespachadorChat envía la respuesta de Aira IA de vuelta al cliente por la línea
// de WhatsApp de la barbería. La implementación real vive en la plataforma.
type DespachadorChat interface {
	EnviarTexto(ctx context.Context, empresaID, numeroDestino, texto string) error
}

// MensajeEntranteWA es un mensaje de texto recibido del webhook de Meta, ya
// desempaquetado del envoltorio de transporte.
type MensajeEntranteWA struct {
	NumeroTelefonoMeta string // phone_number_id de la línea de la barbería
	NumeroCliente      string // número del cliente que escribe (campo "from")
	Texto              string
}

// CasoUsoRecibirWebhookWhatsApp enruta un mensaje entrante de WhatsApp: resuelve
// a qué barbería pertenece la línea, deja que Aira IA conduzca la conversación y
// devuelve la respuesta al cliente por la misma línea.
type CasoUsoRecibirWebhookWhatsApp struct {
	resolutor   ResolutorEmpresaWA
	conversar   *CasoUsoConversarAira
	despachador DespachadorChat
}

func NuevoCasoUsoRecibirWebhookWhatsApp(resolutor ResolutorEmpresaWA, conversar *CasoUsoConversarAira, despachador DespachadorChat) *CasoUsoRecibirWebhookWhatsApp {
	return &CasoUsoRecibirWebhookWhatsApp{resolutor: resolutor, conversar: conversar, despachador: despachador}
}

// Ejecutar procesa un mensaje entrante, deja responder a Aira IA y despacha la
// respuesta de vuelta al cliente. Devuelve la respuesta generada.
func (c *CasoUsoRecibirWebhookWhatsApp) Ejecutar(ctx context.Context, m MensajeEntranteWA) (string, error) {
	empresaID, err := c.resolutor.ResolverEmpresaPorNumeroMeta(ctx, m.NumeroTelefonoMeta)
	if err != nil {
		return "", err
	}
	resp, err := c.conversar.Ejecutar(ctx, SolicitudConversarAira{
		EmpresaID:     empresaID,
		NumeroCliente: m.NumeroCliente,
		Texto:         m.Texto,
	})
	if err != nil {
		return "", err
	}
	if c.despachador != nil && resp.Respuesta != "" {
		if err := c.despachador.EnviarTexto(ctx, empresaID, m.NumeroCliente, resp.Respuesta); err != nil {
			return resp.Respuesta, err
		}
	}
	return resp.Respuesta, nil
}
