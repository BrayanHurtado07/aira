package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/organizacion/barberias"
	"aira/capacidades/organizacion/periodos"
	"aira/capacidades/organizacion/sedes"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositorioEmpresaCockroach

type RepositorioEmpresaCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioEmpresa(pool *pgxpool.Pool) *RepositorioEmpresaCockroach {
	return &RepositorioEmpresaCockroach{pool: pool}
}

func (r *RepositorioEmpresaCockroach) ObtenerActiva(ctx context.Context, id string) (barberias.Empresa, error) {
	var e barberias.Empresa
	err := r.pool.QueryRow(ctx,
		`SELECT id_empresa, nombre, estado FROM empresa WHERE id_empresa = $1 AND estado = 'ACTIVO'`,
		id,
	).Scan(&e.ID, &e.Nombre, &e.Estado)
	if err != nil {
		return barberias.Empresa{}, errores.ErrEmpresaNoActiva
	}
	return e, nil
}

func (r *RepositorioEmpresaCockroach) ObtenerConfiguracion(ctx context.Context, empresaID string) (barberias.ConfiguracionEmpresa, error) {
	var c barberias.ConfiguracionEmpresa
	err := r.pool.QueryRow(ctx,
		`SELECT id_empresa,
		        horas_anticipacion_cancelacion,
		        dias_max_reserva_anticipada,
		        horas_recordatorio_reserva,
		        permite_reserva_mismo_dia,
		        requiere_confirmacion_manual
		 FROM configuracion_empresa
		 WHERE id_empresa = $1`,
		empresaID,
	).Scan(
		&c.EmpresaID,
		&c.HorasAnticipacionCancelacion,
		&c.DiasMaxReservaAnticipada,
		&c.HorasRecordatorioReserva,
		&c.PermiteReservaMismoDia,
		&c.RequiereConfirmacionManual,
	)
	if err != nil {
		return barberias.ConfiguracionEmpresa{}, errores.ErrConfiguracionNoEncontrada
	}
	return c, nil
}

func (r *RepositorioEmpresaCockroach) GuardarConfiguracion(ctx context.Context, config barberias.ConfiguracionEmpresa, actualizadoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "configuracion_empresa_guardar",
		config.EmpresaID,
		config.HorasAnticipacionCancelacion,
		config.DiasMaxReservaAnticipada,
		config.HorasRecordatorioReserva,
		config.PermiteReservaMismoDia,
		config.RequiereConfirmacionManual,
		actualizadoPor,
	)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "EMPRESA_SIN_CONFIGURACION":
			return errores.ErrConfiguracionNoEncontrada
		default:
			return fmt.Errorf("%s", resultado.Error)
		}
	}
	return nil
}

func (r *RepositorioEmpresaCockroach) Guardar(ctx context.Context, empresa barberias.Empresa) (string, error) {
	// Firma real en DB: empresa_crear(p_nombre, p_pais, p_moneda, p_frecuencia_liquidacion, p_creado_por)
	resultado, err := LlamarProc(ctx, r.pool, "empresa_crear",
		empresa.Nombre, "PE", "PEN", "MENSUAL", nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_empresa"), nil
}

func (r *RepositorioEmpresaCockroach) ActualizarSlug(ctx context.Context, empresaID, slug string) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "empresa_actualizar_slug", empresaID, slug)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "slug"), nil
}

func (r *RepositorioEmpresaCockroach) AprovisionarOperacionInicial(
	ctx context.Context, empresaID, nombreSede, direccion, zonaHoraria, creadoPor string,
) (string, string, error) {
	cp := any(creadoPor)
	if creadoPor == "" {
		cp = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "empresa_aprovisionar_inicial",
		empresaID, nombreSede, direccion, zonaHoraria, cp)
	if err != nil {
		return "", "", err
	}
	if !resultado.Exito {
		return "", "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_sucursal"),
		ExtraerCampo(resultado.Datos, "id_periodo"), nil
}

func (r *RepositorioEmpresaCockroach) ResolverSlug(ctx context.Context, slug string) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "empresa_resolver_slug", slug)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_empresa"), nil
}

func (r *RepositorioEmpresaCockroach) ListarTodasConMetricas(ctx context.Context) ([]barberias.EmpresaResumen, error) {
	filas, err := r.pool.Query(ctx, `
		SELECT
			e.id_empresa,
			e.nombre,
			COALESCE(e.slug, '') AS slug,
			e.estado,
			e.creado_en::text,
			COUNT(DISTINCT b.id_barbero)   FILTER (WHERE b.estado = 'ACTIVO')                           AS barberos_activos,
			COUNT(DISTINCT s.id_sucursal)  FILTER (WHERE s.estado = 'ACTIVO')                           AS sucursales_activas,
			COUNT(DISTINCT rv.id_reserva)  FILTER (WHERE rv.creado_en >= NOW() - INTERVAL '30 days')    AS reservas_ultimo_mes,
			COALESCE(MAX(su.estado) FILTER (WHERE su.estado = 'ACTIVA'), 'SIN_SUSCRIPCION')             AS estado_suscripcion
		FROM empresa e
		LEFT JOIN barbero      b  ON b.id_empresa  = e.id_empresa
		LEFT JOIN sucursal     s  ON s.id_empresa  = e.id_empresa
		LEFT JOIN reserva      rv ON rv.id_empresa = e.id_empresa
		LEFT JOIN suscripcion  su ON su.id_empresa = e.id_empresa
		GROUP BY e.id_empresa, e.nombre, e.slug, e.estado, e.creado_en
		ORDER BY e.creado_en DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("listar empresas plataforma: %w", err)
	}
	defer filas.Close()

	var lista []barberias.EmpresaResumen
	for filas.Next() {
		var em barberias.EmpresaResumen
		if err := filas.Scan(
			&em.ID, &em.Nombre, &em.Slug, &em.Estado, &em.CreadoEn,
			&em.BarberosActivos, &em.SucursalesActivas, &em.ReservasUltimoMes, &em.EstadoSuscripcion,
		); err != nil {
			return nil, fmt.Errorf("scan empresa resumen: %w", err)
		}
		lista = append(lista, em)
	}
	return lista, filas.Err()
}

// RepositorioSucursalCockroach

type RepositorioSucursalCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioSucursal(pool *pgxpool.Pool) *RepositorioSucursalCockroach {
	return &RepositorioSucursalCockroach{pool: pool}
}

func (r *RepositorioSucursalCockroach) ObtenerActiva(ctx context.Context, id string) (sedes.Sucursal, error) {
	var s sedes.Sucursal
	err := r.pool.QueryRow(ctx,
		`SELECT id_sucursal, id_empresa, nombre, estado FROM sucursal WHERE id_sucursal = $1 AND estado = 'ACTIVO'`,
		id,
	).Scan(&s.ID, &s.EmpresaID, &s.Nombre, &s.Estado)
	if err != nil {
		return sedes.Sucursal{}, errores.ErrSucursalNoActiva
	}
	return s, nil
}

func (r *RepositorioSucursalCockroach) ListarActivas(ctx context.Context, empresaID string) ([]sedes.Sucursal, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_sucursal, id_empresa, nombre, estado
		 FROM sucursal WHERE id_empresa = $1 AND estado = 'ACTIVO'`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resultado []sedes.Sucursal
	for rows.Next() {
		var s sedes.Sucursal
		if err := rows.Scan(&s.ID, &s.EmpresaID, &s.Nombre, &s.Estado); err != nil {
			return nil, err
		}
		resultado = append(resultado, s)
	}
	return resultado, nil
}

func (r *RepositorioSucursalCockroach) Guardar(ctx context.Context, sucursal sedes.Sucursal) (string, error) {
	// Firma: sucursal_crear(p_id_empresa, p_nombre, p_direccion, p_zona_horaria, p_telefono, p_creado_por)
	direccion := sucursal.Direccion
	if direccion == "" {
		direccion = "-"
	}
	resultado, err := LlamarProc(ctx, r.pool, "sucursal_crear",
		sucursal.EmpresaID, sucursal.Nombre, direccion, "America/Lima", nil, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "EMPRESA_NO_ACTIVA":
			return "", errores.ErrEmpresaNoActiva
		case "EMPRESA_NO_EXISTE":
			return "", errores.ErrEmpresaNoExiste
		case "EMPRESA_SIN_SUSCRIPCION_ACTIVA":
			return "", errores.ErrEmpresaSinSuscripcion
		case "LIMITE_PLAN_EXCEDIDO":
			return "", errores.ErrLimitePlanExcedido
		default:
			return "", fmt.Errorf("%s", resultado.Error)
		}
	}
	return ExtraerCampo(resultado.Datos, "id_sucursal"), nil
}

func (r *RepositorioSucursalCockroach) ListarTodas(ctx context.Context, empresaID string) ([]sedes.Sucursal, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_sucursal, id_empresa, nombre, estado
		 FROM sucursal WHERE id_empresa = $1 ORDER BY nombre`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resultado []sedes.Sucursal
	for rows.Next() {
		var s sedes.Sucursal
		if err := rows.Scan(&s.ID, &s.EmpresaID, &s.Nombre, &s.Estado); err != nil {
			return nil, err
		}
		resultado = append(resultado, s)
	}
	return resultado, nil
}

func (r *RepositorioSucursalCockroach) ActualizarEstadoSucursal(ctx context.Context, sucursalID, estado string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE sucursal SET estado = $1, actualizado_en = now() WHERE id_sucursal = $2`,
		estado, sucursalID,
	)
	return err
}

// RepositorioPeriodoCockroach

type RepositorioPeriodoCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioPeriodo(pool *pgxpool.Pool) *RepositorioPeriodoCockroach {
	return &RepositorioPeriodoCockroach{pool: pool}
}

func (r *RepositorioPeriodoCockroach) ObtenerActivo(ctx context.Context, id string) (periodos.Periodo, error) {
	var p periodos.Periodo
	err := r.pool.QueryRow(ctx,
		`SELECT id_periodo, id_empresa, nombre, fecha_inicio, fecha_fin, estado
		 FROM periodo WHERE id_periodo = $1 AND estado = 'ACTIVO'`,
		id,
	).Scan(&p.ID, &p.EmpresaID, &p.Nombre, &p.FechaInicio, &p.FechaFin, &p.Estado)
	if err != nil {
		return periodos.Periodo{}, errores.ErrPeriodoNoAbierto
	}
	return p, nil
}

func (r *RepositorioPeriodoCockroach) Guardar(ctx context.Context, periodo periodos.Periodo) (string, error) {
	// Firma: periodo_crear(p_id_empresa, p_nombre, p_fecha_inicio, p_fecha_fin, p_creado_por DEFAULT NULL)
	resultado, err := LlamarProc(ctx, r.pool, "periodo_crear",
		periodo.EmpresaID, periodo.Nombre, periodo.FechaInicio, periodo.FechaFin, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_periodo"), nil
}

func (r *RepositorioPeriodoCockroach) Cerrar(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE periodo SET estado = 'CERRADO', actualizado_en = now() WHERE id_periodo = $1`,
		id,
	)
	return err
}

func (r *RepositorioPeriodoCockroach) ListarTodos(ctx context.Context, empresaID string) ([]periodos.Periodo, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_periodo, id_empresa, nombre, fecha_inicio, fecha_fin, estado
		 FROM periodo WHERE id_empresa = $1 ORDER BY fecha_inicio DESC`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resultado []periodos.Periodo
	for rows.Next() {
		var p periodos.Periodo
		if err := rows.Scan(&p.ID, &p.EmpresaID, &p.Nombre, &p.FechaInicio, &p.FechaFin, &p.Estado); err != nil {
			return nil, err
		}
		resultado = append(resultado, p)
	}
	return resultado, nil
}
