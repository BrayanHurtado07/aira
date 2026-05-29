package recordatorios

import "aira/compartido/errores"

type EstadoRecordatorio string

const (
	EstadoRecordatorioPendiente  EstadoRecordatorio = "PENDIENTE"
	EstadoRecordatorioEnviado    EstadoRecordatorio = "ENVIADO"
	EstadoRecordatorioCancelado  EstadoRecordatorio = "CANCELADO"
)

type Recordatorio struct {
	ID        string
	ReservaID string
	EnviarEn  string
	Canal     string
	Estado    EstadoRecordatorio
}

func (r Recordatorio) ValidarPuedeCancelarse() error {
	if r.Estado != EstadoRecordatorioPendiente {
		return errores.ErrOperacionFallida
	}
	return nil
}
