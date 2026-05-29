package cockroach

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ResultadoProc struct {
	Exito bool            `json:"exito"`
	Error string          `json:"error,omitempty"`
	Datos json.RawMessage `json:"datos,omitempty"`
}

// LlamarProc ejecuta un stored procedure que retorna JSONB y parsea el resultado.
func LlamarProc(ctx context.Context, pool *pgxpool.Pool, nombre string, args ...any) (ResultadoProc, error) {
	placeholders := make([]string, len(args))
	for i := range args {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	sql := fmt.Sprintf("SELECT %s(%s)", nombre, joinComas(placeholders))

	var raw []byte
	err := pool.QueryRow(ctx, sql, args...).Scan(&raw)
	if err != nil {
		return ResultadoProc{}, fmt.Errorf("llamar proc %s: %w", nombre, err)
	}

	var resultado ResultadoProc
	if err := json.Unmarshal(raw, &resultado); err != nil {
		return ResultadoProc{}, fmt.Errorf("parsear resultado %s: %w", nombre, err)
	}

	return resultado, nil
}

func joinComas(parts []string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += ","
		}
		out += p
	}
	return out
}

// ExtraerCampo extrae un campo string del JSONB datos del resultado.
func ExtraerCampo(datos json.RawMessage, campo string) string {
	var m map[string]any
	if err := json.Unmarshal(datos, &m); err != nil {
		return ""
	}
	if v, ok := m[campo].(string); ok {
		return v
	}
	return ""
}
