package casos_uso

import "context"

// ResolutorEmpresaWA traduce el número de teléfono de Meta (phone_number_id) a la
// empresa dueña de esa línea de WhatsApp.
type ResolutorEmpresaWA interface {
	ResolverEmpresaPorNumeroMeta(ctx context.Context, idNumeroTelefonoMeta string) (string, error)
}

// MensajeEntranteWA es un mensaje de texto recibido del webhook de Meta, ya
// desempaquetado del envoltorio de transporte.
type MensajeEntranteWA struct {
	NumeroTelefonoMeta string // phone_number_id de la línea de la barbería
	NumeroCliente      string // número del cliente que escribe (campo "from")
	Texto              string
}

// CasoUsoRecibirWebhookWhatsApp enruta un mensaje entrante de WhatsApp: resuelve
// a qué barbería pertenece la línea y deja que Aira IA conduzca la conversación.
type CasoUsoRecibirWebhookWhatsApp struct {
	resolutor ResolutorEmpresaWA
	conversar *CasoUsoConversarAira
}

func NuevoCasoUsoRecibirWebhookWhatsApp(resolutor ResolutorEmpresaWA, conversar *CasoUsoConversarAira) *CasoUsoRecibirWebhookWhatsApp {
	return &CasoUsoRecibirWebhookWhatsApp{resolutor: resolutor, conversar: conversar}
}

// Ejecutar procesa un mensaje entrante y devuelve la respuesta de Aira IA.
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
	return resp.Respuesta, nil
}
