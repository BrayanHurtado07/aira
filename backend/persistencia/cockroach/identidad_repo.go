package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/identidad/sesiones"
	"aira/capacidades/identidad/usuarios"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositorioUsuarioCockroach

type RepositorioUsuarioCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioUsuario(pool *pgxpool.Pool) *RepositorioUsuarioCockroach {
	return &RepositorioUsuarioCockroach{pool: pool}
}

func (r *RepositorioUsuarioCockroach) ObtenerPorCorreo(ctx context.Context, correo string) (usuarios.Usuario, error) {
	var u usuarios.Usuario
	err := r.pool.QueryRow(ctx,
		`SELECT id_usuario, nombre, correo_electronico, contrasena_hash, estado, correo_verificado
		 FROM usuario WHERE correo_electronico = lower($1)`,
		correo,
	).Scan(&u.ID, &u.Nombre, &u.Correo, &u.HashPassword, &u.Estado, &u.Verificado)
	if err != nil {
		return usuarios.Usuario{}, errores.ErrIdentidadNoExiste
	}
	return u, nil
}

func (r *RepositorioUsuarioCockroach) ObtenerPorID(ctx context.Context, id string) (usuarios.Usuario, error) {
	var u usuarios.Usuario
	err := r.pool.QueryRow(ctx,
		`SELECT id_usuario, nombre, correo_electronico, contrasena_hash, estado, correo_verificado
		 FROM usuario WHERE id_usuario = $1`,
		id,
	).Scan(&u.ID, &u.Nombre, &u.Correo, &u.HashPassword, &u.Estado, &u.Verificado)
	if err != nil {
		return usuarios.Usuario{}, errores.ErrIdentidadNoExiste
	}
	return u, nil
}

func (r *RepositorioUsuarioCockroach) Guardar(ctx context.Context, u usuarios.Usuario, hashPassword string) (string, error) {
	// Firma: usuario_registrar(p_correo_electronico, p_contrasena_hash, p_nombre, p_telefono DEFAULT NULL)
	resultado, err := LlamarProc(ctx, r.pool, "usuario_registrar",
		u.Correo, hashPassword, u.Nombre, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		if resultado.Error == "CORREO_ELECTRONICO_YA_REGISTRADO" {
			return "", errores.ErrCorreoYaRegistrado
		}
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_usuario"), nil
}

func (r *RepositorioUsuarioCockroach) CambiarPassword(ctx context.Context, id, hashPassword string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE usuario SET contrasena_hash = $1, actualizado_en = now() WHERE id_usuario = $2`,
		hashPassword, id,
	)
	return err
}

func (r *RepositorioUsuarioCockroach) Inactivar(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE usuario SET estado = 'INACTIVO', actualizado_en = now() WHERE id_usuario = $1`,
		id,
	)
	return err
}

func (r *RepositorioUsuarioCockroach) ObtenerPrimeraEmpresaActiva(ctx context.Context, usuarioID string) (string, error) {
	var empresaID string
	err := r.pool.QueryRow(ctx,
		`SELECT id_empresa FROM alcance WHERE id_usuario = $1 AND estado = 'ACTIVO' LIMIT 1`,
		usuarioID,
	).Scan(&empresaID)
	if err != nil {
		return "", err
	}
	return empresaID, nil
}

// RepositorioSesionCockroach

type RepositorioSesionCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioSesion(pool *pgxpool.Pool) *RepositorioSesionCockroach {
	return &RepositorioSesionCockroach{pool: pool}
}

func (r *RepositorioSesionCockroach) Guardar(
	ctx context.Context,
	s sesiones.SolicitudGuardarSesion,
) (sesiones.SesionGlobal, error) {
	// Firma real: usuario_iniciar_sesion(p_id_usuario, p_token_hash, p_refresh_hash,
	//             p_ip_origen, p_user_agent DEFAULT NULL, p_minutos_vida DEFAULT 60)
	minutos := s.MinutosVida
	if minutos <= 0 {
		minutos = 1440
	}

	userAgent := any(s.UserAgent)
	if s.UserAgent == "" {
		userAgent = nil
	}
	ip := s.IPOrigen
	if ip == "" {
		ip = "0.0.0.0"
	}

	resultado, err := LlamarProc(ctx, r.pool, "usuario_iniciar_sesion",
		s.UsuarioID, s.TokenHash, s.RefreshHash, ip, userAgent, minutos)
	if err != nil {
		return sesiones.SesionGlobal{}, err
	}
	if !resultado.Exito {
		return sesiones.SesionGlobal{}, fmt.Errorf("%s", resultado.Error)
	}

	return sesiones.SesionGlobal{
		ID:        ExtraerCampo(resultado.Datos, "id_sesion_global"),
		UsuarioID: s.UsuarioID,
		TokenHash: s.TokenHash,
		Estado:    "ACTIVA",
		ExpiraEn:  ExtraerCampo(resultado.Datos, "expira_en"),
	}, nil
}

func (r *RepositorioSesionCockroach) ObtenerPorTokenHash(ctx context.Context, hash string) (sesiones.SesionGlobal, error) {
	var s sesiones.SesionGlobal
	// sesion_global solo tiene: id_sesion_global, id_usuario, token_hash, estado, expira_en, ...
	err := r.pool.QueryRow(ctx,
		`SELECT id_sesion_global, id_usuario, token_hash, estado
		 FROM sesion_global WHERE token_hash = $1 AND estado = 'ACTIVA'`,
		hash,
	).Scan(&s.ID, &s.UsuarioID, &s.TokenHash, &s.Estado)
	if err != nil {
		return sesiones.SesionGlobal{}, errores.ErrSesionNoExiste
	}
	return s, nil
}

func (r *RepositorioSesionCockroach) InvalidarPorUsuario(ctx context.Context, usuarioID string) (int, error) {
	resultado, err := r.pool.Exec(ctx,
		`UPDATE sesion_global
		 SET estado = 'INVALIDADA', actualizado_en = now()
		 WHERE id_usuario = $1 AND estado = 'ACTIVA'`,
		usuarioID,
	)
	if err != nil {
		return 0, err
	}
	return int(resultado.RowsAffected()), nil
}

func (r *RepositorioSesionCockroach) ActualizarHashes(ctx context.Context, sesionID, tokenHash, refreshHash string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE sesion_global SET token_hash = $1, refresh_token_hash = $2 WHERE id_sesion_global = $3`,
		tokenHash, refreshHash, sesionID,
	)
	return err
}

func (r *RepositorioSesionCockroach) ObtenerPorRefreshHash(ctx context.Context, hash string) (sesiones.SesionGlobal, error) {
	var s sesiones.SesionGlobal
	err := r.pool.QueryRow(ctx,
		`SELECT id_sesion_global, id_usuario, token_hash, estado
		 FROM sesion_global WHERE refresh_token_hash = $1 AND estado = 'ACTIVA'`,
		hash,
	).Scan(&s.ID, &s.UsuarioID, &s.TokenHash, &s.Estado)
	if err != nil {
		return sesiones.SesionGlobal{}, errores.ErrSesionNoExiste
	}
	return s, nil
}

func (r *RepositorioSesionCockroach) Revocar(ctx context.Context, id string) error {
	// Firma: usuario_cerrar_sesion(p_id_sesion_global, p_id_usuario DEFAULT NULL)
	resultado, err := LlamarProc(ctx, r.pool, "usuario_cerrar_sesion", id, nil)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

// UsuarioResumen para listados de asignación de alcances.
type UsuarioResumen struct {
	ID     string `json:"id"`
	Nombre string `json:"nombre"`
	Correo string `json:"correo"`
	Estado string `json:"estado"`
}

// ListarActivos devuelve todos los usuarios activos del sistema.
func (r *RepositorioUsuarioCockroach) ListarActivos(ctx context.Context) ([]UsuarioResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT id_usuario, nombre, correo_electronico, estado
		 FROM usuario
		 WHERE estado = 'ACTIVO'
		 ORDER BY nombre`,
	)
	if err != nil {
		return nil, fmt.Errorf("listar usuarios: %w", err)
	}
	defer filas.Close()

	var resultado []UsuarioResumen
	for filas.Next() {
		var u UsuarioResumen
		if err := filas.Scan(&u.ID, &u.Nombre, &u.Correo, &u.Estado); err != nil {
			return nil, fmt.Errorf("escanear usuario: %w", err)
		}
		resultado = append(resultado, u)
	}
	if resultado == nil {
		resultado = []UsuarioResumen{}
	}
	return resultado, nil
}
