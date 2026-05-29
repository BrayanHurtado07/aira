package auditoria

import (
	"context"
	"encoding/json"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Auditoria interface {
	Registrar(ctx context.Context, evento Evento)
}

type Evento struct {
	UsuarioID string
	EmpresaID string
	Entidad   string
	EntidadID string
	Accion    string
	Detalle   map[string]any
}

type AuditorDB struct {
	pool *pgxpool.Pool
}

func NuevoAuditorDB(pool *pgxpool.Pool) *AuditorDB {
	return &AuditorDB{pool: pool}
}

func (a *AuditorDB) Registrar(ctx context.Context, evento Evento) {
	var detalleJSON []byte
	if evento.Detalle != nil {
		detalleJSON, _ = json.Marshal(evento.Detalle)
	}

	_, err := a.pool.Exec(ctx,
		`INSERT INTO auditoria_accion
		 (id_usuario, id_empresa, entidad, entidad_id, accion, detalle_json)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		nullableUUID(evento.UsuarioID),
		nullableUUID(evento.EmpresaID),
		evento.Entidad,
		nullableUUID(evento.EntidadID),
		evento.Accion,
		detalleJSON,
	)
	if err != nil {
		log.Printf("[auditoria] error registrando %s en %s: %v", evento.Accion, evento.Entidad, err)
	}
}

func nullableUUID(s string) any {
	if s == "" {
		return nil
	}
	return s
}
