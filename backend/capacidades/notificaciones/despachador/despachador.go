package despachador

import (
	"context"
	"fmt"
	"log"

	"aira/capacidades/notificaciones/recordatorios"
)

// DespachadorRecordatorio envía el mensaje de recordatorio por el canal indicado.
// Implementaciones reales pueden usar la API de WhatsApp Business o un servicio de correo.
type DespachadorRecordatorio interface {
	Enviar(ctx context.Context, rec recordatorios.RecordatorioPendiente) error
}

// DespachadorLog es la implementación de desarrollo: solo escribe en stdout.
// Reemplazar por DespachadorWhatsApp o DespachadorEmail en producción.
type DespachadorLog struct{}

func NuevoDespachadorLog() *DespachadorLog {
	return &DespachadorLog{}
}

func (d *DespachadorLog) Enviar(_ context.Context, rec recordatorios.RecordatorioPendiente) error {
	log.Printf("[recordatorio] canal=%s telefono=%s cliente=%q barberia=%q barbero=%q fecha=%s id=%s",
		rec.Canal,
		rec.TelefonoCliente,
		rec.NombreCliente,
		rec.NombreBarberia,
		rec.NombreBarbero,
		rec.FechaHoraReserva,
		rec.ID,
	)
	return nil
}

// MensajeWhatsApp arma el texto del recordatorio para WhatsApp.
func MensajeWhatsApp(rec recordatorios.RecordatorioPendiente) string {
	return fmt.Sprintf(
		"Hola %s, te recordamos tu cita en %s con %s el %s. ¡Te esperamos!",
		rec.NombreCliente,
		rec.NombreBarberia,
		rec.NombreBarbero,
		rec.FechaHoraReserva,
	)
}
