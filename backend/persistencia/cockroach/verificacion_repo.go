package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/identidad/verificaciones"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RepositorioVerificacionCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioVerificacion(pool *pgxpool.Pool) *RepositorioVerificacionCockroach {
	return &RepositorioVerificacionCockroach{pool: pool}
}

// Asegurar que implementa la interfaz en tiempo de compilación.
var _ verificaciones.RepositorioVerificacion = (*RepositorioVerificacionCockroach)(nil)

// CrearToken llama a verificacion_correo_crear y almacena el hash con TTL de 60 minutos.
func (r *RepositorioVerificacionCockroach) CrearToken(ctx context.Context, usuarioID, codigoHash string) error {
	resultado, err := LlamarProc(ctx, r.pool, "verificacion_correo_crear",
		usuarioID, codigoHash, 60)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "USUARIO_NO_ACTIVO":
			return errores.ErrIdentidadNoActiva
		default:
			return fmt.Errorf("%s", resultado.Error)
		}
	}
	return nil
}

// VerificarCorreo llama a usuario_verificar_correo que valida el token
// Y marca correo_verificado = true en la tabla usuario.
func (r *RepositorioVerificacionCockroach) VerificarCorreo(ctx context.Context, usuarioID, codigoHash string) error {
	resultado, err := LlamarProc(ctx, r.pool, "usuario_verificar_correo",
		usuarioID, codigoHash)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "CODIGO_INVALIDO_O_EXPIRADO":
			return errores.ErrCodigoInvalidoOExpirado
		default:
			return fmt.Errorf("%s", resultado.Error)
		}
	}
	return nil
}

// ValidarYUsarToken valida el token con SQL plano y lo marca como usado,
// sin tocar correo_verificado. Diseñado para el flujo de restablecimiento de contraseña.
func (r *RepositorioVerificacionCockroach) ValidarYUsarToken(ctx context.Context, usuarioID, codigoHash string) error {
	var id string
	err := r.pool.QueryRow(ctx,
		`UPDATE verificacion_correo_electronico
		 SET usado = true
		 WHERE id_verificacion = (
		     SELECT id_verificacion
		     FROM verificacion_correo_electronico
		     WHERE id_usuario  = $1
		       AND codigo_hash = $2
		       AND usado       = false
		       AND expira_en   > now()
		     LIMIT 1
		 )
		 RETURNING id_verificacion`,
		usuarioID, codigoHash,
	).Scan(&id)
	if err != nil {
		return errores.ErrCodigoInvalidoOExpirado
	}
	return nil
}
