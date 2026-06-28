// Package google — cliente de Google Calendar.
// SincronizadorLog es la implementación de desarrollo: no llama a la API real
// (que requiere credenciales OAuth2 y callback público). Satisface la interfaz
// integraciones.SincronizadorCalendar por firma; la implementación real se
// inyecta en producción cuando existan credenciales, igual que el cliente Meta.
package google

import (
	"context"
	"log"
)

type SincronizadorLog struct{}

func NuevoSincronizadorLog() *SincronizadorLog {
	return &SincronizadorLog{}
}

// CrearEvento simula la creación del evento en Google Calendar y devuelve un id
// externo determinista (único por reserva).
func (s *SincronizadorLog) CrearEvento(ctx context.Context, empresaID, reservaID string) (string, error) {
	log.Printf("[gcal-log] evento simulado (sin API real) empresa=%s reserva=%s", empresaID, reservaID)
	return "dev-gcal-" + reservaID, nil
}
