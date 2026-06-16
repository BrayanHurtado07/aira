package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/gobierno_acceso/alcances"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RepositorioAlcanceCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioAlcance(pool *pgxpool.Pool) *RepositorioAlcanceCockroach {
	return &RepositorioAlcanceCockroach{pool: pool}
}

func (r *RepositorioAlcanceCockroach) Asignar(ctx context.Context, alcance alcances.Alcance) (string, error) {
	sucursalID := any(alcance.SucursalID)
	if alcance.SucursalID == "" {
		sucursalID = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "alcance_asignar",
		alcance.UsuarioID, alcance.EmpresaID, alcance.RolID, sucursalID, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		if resultado.Error == "ALCANCE_DUPLICADO" {
			return "", errores.ErrAlcanceDuplicado
		}
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_alcance"), nil
}

func (r *RepositorioAlcanceCockroach) Revocar(ctx context.Context, id string) error {
	resultado, err := LlamarProc(ctx, r.pool, "alcance_revocar", id, nil)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

func (r *RepositorioAlcanceCockroach) ObtenerActivos(ctx context.Context, usuarioID, empresaID string) ([]alcances.Alcance, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_alcance, id_usuario, id_empresa, id_rol, id_sucursal, estado
		 FROM alcance WHERE id_usuario = $1 AND id_empresa = $2 AND estado = 'ACTIVO'`,
		usuarioID, empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resultado []alcances.Alcance
	for rows.Next() {
		var a alcances.Alcance
		var sucursalID *string
		if err := rows.Scan(&a.ID, &a.UsuarioID, &a.EmpresaID, &a.RolID, &sucursalID, &a.Estado); err != nil {
			return nil, err
		}
		if sucursalID != nil {
			a.SucursalID = *sucursalID
		}
		resultado = append(resultado, a)
	}
	return resultado, nil
}

func (r *RepositorioAlcanceCockroach) ValidarPermiso(ctx context.Context, usuarioID, empresaID, codigoPermiso string) error {
	var existe bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS (
			SELECT 1 FROM alcance a
			JOIN rol_permiso rp ON rp.id_rol = a.id_rol
			JOIN permiso p ON p.id_permiso = rp.id_permiso
			WHERE a.id_usuario = $1
			  AND a.id_empresa = $2
			  AND a.estado = 'ACTIVO'
			  AND p.codigo = $3
		)`,
		usuarioID, empresaID, codigoPermiso,
	).Scan(&existe)
	if err != nil {
		return errores.ErrPermisoDenegado
	}
	if !existe {
		return errores.ErrPermisoDenegado
	}
	return nil
}

func (r *RepositorioAlcanceCockroach) ObtenerNombreRol(ctx context.Context, usuarioID, empresaID string) (string, error) {
	var nombre string
	var err error

	// SUPERADMIN no está ligado a ninguna empresa: busca por usuario solamente.
	if empresaID == "" {
		err = r.pool.QueryRow(ctx,
			`SELECT rl.nombre
			 FROM alcance a
			 JOIN rol rl ON rl.id_rol = a.id_rol
			 WHERE a.id_usuario = $1
			   AND a.estado = 'ACTIVO'
			 ORDER BY a.creado_en DESC
			 LIMIT 1`,
			usuarioID,
		).Scan(&nombre)
	} else {
		err = r.pool.QueryRow(ctx,
			`SELECT rl.nombre
			 FROM alcance a
			 JOIN rol rl ON rl.id_rol = a.id_rol
			 WHERE a.id_usuario = $1
			   AND a.id_empresa = $2
			   AND a.estado = 'ACTIVO'
			 ORDER BY a.creado_en DESC
			 LIMIT 1`,
			usuarioID, empresaID,
		).Scan(&nombre)
	}
	if err != nil {
		return "", nil
	}
	return nombre, nil
}

func (r *RepositorioAlcanceCockroach) BuscarIDRolPorNombre(ctx context.Context, nombre string) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx,
		`SELECT id_rol FROM rol WHERE nombre = $1 LIMIT 1`,
		nombre,
	).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("rol %q no encontrado", nombre)
	}
	return id, nil
}

// AlcanceResumen para listados en el frontend.
type AlcanceResumen struct {
	ID            string `json:"id"`
	UsuarioID     string `json:"usuario_id"`
	NombreUsuario string `json:"nombre_usuario"`
	EmpresaID     string `json:"empresa_id"`
	RolID         string `json:"rol_id"`
	NombreRol     string `json:"nombre_rol"`
	Estado        string `json:"estado"`
	CreadoEn      string `json:"creado_en"`
}

// RolResumen para el selector de roles.
type RolResumen struct {
	ID     string `json:"id"`
	Nombre string `json:"nombre"`
}

// ListarAlcancesPorEmpresa devuelve todos los alcances activos de una empresa con nombres resueltos.
func (r *RepositorioAlcanceCockroach) ListarAlcancesPorEmpresa(ctx context.Context, empresaID string) ([]AlcanceResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT a.id_alcance,
		        a.id_usuario,
		        COALESCE(u.nombre, 'Usuario'),
		        a.id_empresa,
		        a.id_rol,
		        COALESCE(rl.nombre, 'Rol'),
		        a.estado,
		        a.creado_en::text
		 FROM alcance a
		 LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
		 LEFT JOIN rol rl ON rl.id_rol = a.id_rol
		 WHERE a.id_empresa = $1
		 ORDER BY a.creado_en DESC`,
		empresaID,
	)
	if err != nil {
		return nil, fmt.Errorf("listar alcances: %w", err)
	}
	defer filas.Close()

	var resultado []AlcanceResumen
	for filas.Next() {
		var a AlcanceResumen
		if err := filas.Scan(&a.ID, &a.UsuarioID, &a.NombreUsuario, &a.EmpresaID, &a.RolID, &a.NombreRol, &a.Estado, &a.CreadoEn); err != nil {
			return nil, fmt.Errorf("escanear alcance: %w", err)
		}
		resultado = append(resultado, a)
	}
	if resultado == nil {
		resultado = []AlcanceResumen{}
	}
	return resultado, nil
}

// ListarRoles devuelve todos los roles disponibles.
func (r *RepositorioAlcanceCockroach) ListarRoles(ctx context.Context) ([]RolResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT id_rol, nombre FROM rol ORDER BY nombre`,
	)
	if err != nil {
		return nil, fmt.Errorf("listar roles: %w", err)
	}
	defer filas.Close()

	var resultado []RolResumen
	for filas.Next() {
		var rl RolResumen
		if err := filas.Scan(&rl.ID, &rl.Nombre); err != nil {
			return nil, fmt.Errorf("escanear rol: %w", err)
		}
		resultado = append(resultado, rl)
	}
	if resultado == nil {
		resultado = []RolResumen{}
	}
	return resultado, nil
}
