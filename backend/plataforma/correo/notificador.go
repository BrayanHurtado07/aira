package correo

import (
	"context"
	"log"
)

// NotificadorCorreo abstrae el envío de correos transaccionales.
// En producción se reemplaza por una implementación real (SendGrid, SES, etc.).
type NotificadorCorreo interface {
	EnviarCodigoVerificacion(ctx context.Context, correo, nombre, codigo string) error
	EnviarCodigoReset(ctx context.Context, correo, nombre, codigo string) error
}

// NotificadorCorreoLog imprime los códigos en stdout — útil en desarrollo.
type NotificadorCorreoLog struct{}

func NuevoNotificadorCorreoLog() *NotificadorCorreoLog {
	return &NotificadorCorreoLog{}
}

func (n *NotificadorCorreoLog) EnviarCodigoVerificacion(_ context.Context, correoDestino, nombre, codigo string) error {
	log.Printf("[DEV-CORREO] verificacion | para=%s (%s) | codigo=%s", correoDestino, nombre, codigo)
	return nil
}

func (n *NotificadorCorreoLog) EnviarCodigoReset(_ context.Context, correoDestino, nombre, codigo string) error {
	log.Printf("[DEV-CORREO] reset-password | para=%s (%s) | codigo=%s", correoDestino, nombre, codigo)
	return nil
}
