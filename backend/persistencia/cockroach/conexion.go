package cockroach

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NuevaConexion(ctx context.Context) (*pgxpool.Pool, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=require",
		env("DB_HOST", "localhost"),
		env("DB_PORT", "26257"),
		env("DB_NAME", "aira"),
		env("DB_USER", "root"),
		env("DB_PASSWORD", ""),
	)

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("conexion cockroach: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping cockroach: %w", err)
	}

	return pool, nil
}

func env(clave, defecto string) string {
	if v := os.Getenv(clave); v != "" {
		return v
	}
	return defecto
}
