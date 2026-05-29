package eventos

import (
	"context"
	"log"
	"time"
)

// PublicadorEventos es la abstracción para emitir eventos de dominio.
// La implementación actual registra en log. En producción se publicaría a un broker.
type PublicadorEventos interface {
	Publicar(ctx context.Context, evento EventoDominio)
}

type publicadorLog struct{}

func NuevoPublicadorLog() PublicadorEventos {
	return &publicadorLog{}
}

func (p *publicadorLog) Publicar(_ context.Context, ev EventoDominio) {
	log.Printf("[evento] tipo=%s entidad=%s id=%s ocurrido_en=%s datos=%v",
		ev.Tipo, ev.EntidadTipo, ev.EntidadID,
		ev.OcurridoEn.Format(time.RFC3339), ev.Datos)
}
