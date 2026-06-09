package worker

import (
	"context"
	"log"
	"time"

	"aira/capacidades/notificaciones/despachador"
	"aira/capacidades/notificaciones/recordatorios"
)

const (
	intervalo       = 60 * time.Second
	limitePorCiclo  = 50
)

type WorkerRecordatorio struct {
	repositorio recordatorios.RepositorioRecordatorio
	despacho    despachador.DespachadorRecordatorio
}

func NuevoWorkerRecordatorio(
	repo recordatorios.RepositorioRecordatorio,
	des despachador.DespachadorRecordatorio,
) *WorkerRecordatorio {
	return &WorkerRecordatorio{repositorio: repo, despacho: des}
}

// Iniciar lanza el ciclo de despacho en una goroutine.
// Se detiene cuando ctx es cancelado.
func (w *WorkerRecordatorio) Iniciar(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(intervalo)
		defer ticker.Stop()

		// Ejecutar un ciclo inmediato al arrancar.
		w.ejecutarCiclo(ctx)

		for {
			select {
			case <-ctx.Done():
				log.Println("[worker-recordatorio] detenido")
				return
			case <-ticker.C:
				w.ejecutarCiclo(ctx)
			}
		}
	}()
}

func (w *WorkerRecordatorio) ejecutarCiclo(ctx context.Context) {
	pendientes, err := w.repositorio.ObtenerPendientes(ctx, limitePorCiclo)
	if err != nil {
		log.Printf("[worker-recordatorio] error obteniendo pendientes: %v", err)
		return
	}
	if len(pendientes) == 0 {
		return
	}

	log.Printf("[worker-recordatorio] despachando %d recordatorio(s)", len(pendientes))

	for _, rec := range pendientes {
		if err := w.despacho.Enviar(ctx, rec); err != nil {
			log.Printf("[worker-recordatorio] error despachando id=%s canal=%s: %v", rec.ID, rec.Canal, err)
			continue
		}
		if err := w.repositorio.MarcarEnviado(ctx, rec.ID); err != nil {
			log.Printf("[worker-recordatorio] error marcando enviado id=%s: %v", rec.ID, err)
		}
	}
}
