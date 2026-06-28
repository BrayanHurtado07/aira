package reputacion

import "context"

// Resena es una reseña con su calificación de barbero (lectura para moderación).
type Resena struct {
	ID            string `json:"id"`
	ReservaID     string `json:"reserva_id"`
	Estado        string `json:"estado"`
	BarberoNombre string `json:"barbero_nombre"`
	PuntajeBarbero int   `json:"puntaje_barbero"`
	Comentario    string `json:"comentario"`
	CreadoEn      string `json:"creado_en"`
}

// ReputacionBarbero es el promedio público de un barbero (reseñas PUBLICADAS).
type ReputacionBarbero struct {
	BarberoID string  `json:"barbero_id"`
	Promedio  string  `json:"promedio"`
	Total     int     `json:"total_resenas"`
}

// RepositorioReputacion agrupa la persistencia de reseñas y calificaciones.
type RepositorioReputacion interface {
	RegistrarResena(ctx context.Context, reservaID string, puntajeBarbero, puntajeSucursal int, comentario, creadoPor string) (string, error)
	ActualizarEstado(ctx context.Context, resenaID, nuevoEstado, actualizadoPor string) error
	ListarResenas(ctx context.Context, empresaID, estado string) ([]Resena, error)
	PromedioBarbero(ctx context.Context, barberoID string) (ReputacionBarbero, error)
}
