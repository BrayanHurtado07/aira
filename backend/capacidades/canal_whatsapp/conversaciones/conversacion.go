package conversaciones

import "aira/compartido/errores"

type EstadoConversacion string

const (
	EstadoConversacionActiva   EstadoConversacion = "ACTIVA"
	EstadoConversacionCerrada  EstadoConversacion = "CERRADA"
)

type Conversacion struct {
	ID             string
	EmpresaID      string
	NumeroCliente  string
	Estado         EstadoConversacion
}

func (c Conversacion) ValidarEstaActiva() error {
	if c.Estado != EstadoConversacionActiva {
		return errores.ErrConversacionNoActiva
	}
	return nil
}
