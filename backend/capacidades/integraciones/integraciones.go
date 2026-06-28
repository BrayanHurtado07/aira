package integraciones

import "context"

// EstadoIntegracion describe el vínculo de Google Calendar de una empresa.
type EstadoIntegracion struct {
	Conectado bool   `json:"conectado"`
	Estado    string `json:"estado"`
	Correo    string `json:"correo_propietario"`
	ExpiraEn  string `json:"expira_en"`
}

// RepositorioIntegracion persiste el token de Google Calendar y los eventos
// sincronizados de cada reserva.
type RepositorioIntegracion interface {
	GuardarTokenGoogle(ctx context.Context, empresaID, accessCifrado, refreshCifrado, expiraEn, correo string) (string, error)
	RevocarTokenGoogle(ctx context.Context, empresaID string) error
	ObtenerEstadoGoogle(ctx context.Context, empresaID string) (EstadoIntegracion, error)
	RegistrarEventoCalendar(ctx context.Context, reservaID, empresaID, googleEventID, creadoPor string) (string, error)
}

// SincronizadorCalendar abstrae el cliente de la API de Google Calendar.
// En dev se usa una implementación de log; en producción, la real con OAuth2.
type SincronizadorCalendar interface {
	// CrearEvento crea el evento en Google Calendar y devuelve su id externo.
	CrearEvento(ctx context.Context, empresaID, reservaID string) (string, error)
}
