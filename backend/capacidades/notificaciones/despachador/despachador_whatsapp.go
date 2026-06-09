package despachador

import (
	"context"
	"fmt"
	"log"
	"os"

	"aira/capacidades/canal_whatsapp/sesion_wa"
	"aira/capacidades/notificaciones/recordatorios"
	"aira/plataforma/cifrado"
	"aira/plataforma/whatsapp/meta"
)

// DespachadorWhatsApp envía recordatorios via WhatsApp usando Meta Cloud API.
// Por empresa busca la sesión conectada, descifra el token y llama a la API.
// Si la empresa no tiene sesión configurada, loguea y continúa (no falla).
type DespachadorWhatsApp struct {
	repoSesion     sesion_wa.RepositorioSesionWhatsApp
	clienteMeta    *meta.ClienteMeta
	claveCifrado   string
	// NombrePlantilla es la plantilla aprobada en Meta para recordatorios.
	// Si está vacía se intenta envío como texto libre (solo válido en ventana 24h).
	NombrePlantilla string
	// IdiomaPlantilla: código de idioma Meta, ej. "es_LA".
	IdiomaPlantilla string
}

func NuevoDespachadorWhatsApp(
	repoSesion sesion_wa.RepositorioSesionWhatsApp,
	claveCifrado string,
) *DespachadorWhatsApp {
	return &DespachadorWhatsApp{
		repoSesion:      repoSesion,
		clienteMeta:     meta.NuevoClienteMeta(),
		claveCifrado:    claveCifrado,
		NombrePlantilla: os.Getenv("WA_TEMPLATE_RECORDATORIO"),
		IdiomaPlantilla: envConDefault("WA_TEMPLATE_IDIOMA", "es_LA"),
	}
}

func (d *DespachadorWhatsApp) Enviar(ctx context.Context, rec recordatorios.RecordatorioPendiente) error {
	if rec.Canal != "WHATSAPP" {
		return nil
	}
	if rec.TelefonoCliente == "" {
		return fmt.Errorf("recordatorio %s sin teléfono de cliente", rec.ID)
	}

	sesion, err := d.repoSesion.ObtenerConectada(ctx, rec.EmpresaID)
	if err != nil {
		log.Printf("[wa-despachador] empresa %s sin sesión WhatsApp conectada — omitiendo recordatorio %s", rec.EmpresaID, rec.ID)
		return nil
	}
	if sesion.IDNumeroTelefonoMeta == "" {
		log.Printf("[wa-despachador] empresa %s sin phone_number_id configurado — omitiendo recordatorio %s", rec.EmpresaID, rec.ID)
		return nil
	}

	accessToken, err := cifrado.Descifrar(sesion.TokenAccesoCifrado, d.claveCifrado)
	if err != nil {
		return fmt.Errorf("wa-despachador: descifrar token empresa %s: %w", rec.EmpresaID, err)
	}

	if d.NombrePlantilla != "" {
		return d.clienteMeta.EnviarPlantilla(
			ctx,
			sesion.IDNumeroTelefonoMeta,
			accessToken,
			rec.TelefonoCliente,
			d.NombrePlantilla,
			d.IdiomaPlantilla,
			[]string{rec.NombreCliente, rec.NombreBarberia, rec.NombreBarbero, rec.FechaHoraReserva},
		)
	}

	return d.clienteMeta.EnviarTexto(
		ctx,
		sesion.IDNumeroTelefonoMeta,
		accessToken,
		rec.TelefonoCliente,
		MensajeWhatsApp(rec),
	)
}

func envConDefault(clave, defecto string) string {
	if v := os.Getenv(clave); v != "" {
		return v
	}
	return defecto
}
