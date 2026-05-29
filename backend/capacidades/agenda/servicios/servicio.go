package servicios

import "aira/compartido/errores"

type EstadoServicio string

const (
	EstadoServicioActivo   EstadoServicio = "ACTIVO"
	EstadoServicioInactivo EstadoServicio = "INACTIVO"
)

type Servicio struct {
	ID              string         `json:"id"`
	EmpresaID       string         `json:"id_empresa"`
	Nombre          string         `json:"nombre"`
	DuracionMinutos int            `json:"duracion_minutos"`
	PrecioBase      float64        `json:"precio"`
	Descripcion     string         `json:"descripcion,omitempty"`
	Estado          EstadoServicio `json:"estado"`
}

func (s Servicio) ValidarEstaActivo() error {
	if s.Estado != EstadoServicioActivo {
		return errores.ErrServicioNoActivo
	}
	return nil
}
