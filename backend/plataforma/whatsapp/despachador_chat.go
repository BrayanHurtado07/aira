package whatsapp

import (
	"context"
	"log"

	"aira/capacidades/canal_whatsapp/sesion_wa"
	"aira/plataforma/cifrado"
	"aira/plataforma/whatsapp/meta"
)

// DespachadorChatMeta envía las respuestas de Aira IA al cliente vía Meta Cloud
// API. Por empresa busca la sesión conectada, descifra el token y llama a la API.
// Si la empresa no tiene línea configurada, loguea y continúa (no rompe el flujo
// entrante: Meta exige 200 rápido y un fallo de envío no debe bloquear la recepción).
type DespachadorChatMeta struct {
	repoSesion   sesion_wa.RepositorioSesionWhatsApp
	cliente      *meta.ClienteMeta
	claveCifrado string
}

func NuevoDespachadorChatMeta(repoSesion sesion_wa.RepositorioSesionWhatsApp, claveCifrado string) *DespachadorChatMeta {
	return &DespachadorChatMeta{
		repoSesion:   repoSesion,
		cliente:      meta.NuevoClienteMeta(),
		claveCifrado: claveCifrado,
	}
}

func (d *DespachadorChatMeta) EnviarTexto(ctx context.Context, empresaID, numeroDestino, texto string) error {
	log.Printf("[wa-chat] → empresa=%s to=%s: %q", empresaID, numeroDestino, texto)

	sesion, err := d.repoSesion.ObtenerConectada(ctx, empresaID)
	if err != nil {
		log.Printf("[wa-chat] empresa %s sin sesión WhatsApp conectada — no se envía la respuesta", empresaID)
		return nil
	}
	if sesion.IDNumeroTelefonoMeta == "" {
		log.Printf("[wa-chat] empresa %s sin phone_number_id — no se envía la respuesta", empresaID)
		return nil
	}

	accessToken, err := cifrado.Descifrar(sesion.TokenAccesoCifrado, d.claveCifrado)
	if err != nil {
		log.Printf("[wa-chat] empresa %s: token no descifrable — no se envía (revisa credenciales Meta)", empresaID)
		return nil
	}

	return d.cliente.EnviarTexto(ctx, sesion.IDNumeroTelefonoMeta, accessToken, numeroDestino, texto)
}
