package cockroach

import (
	"context"
	"time"

	"aira/capacidades/tablero"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RepositorioTableroCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioTablero(pool *pgxpool.Pool) *RepositorioTableroCockroach {
	return &RepositorioTableroCockroach{pool: pool}
}

func (r *RepositorioTableroCockroach) ObtenerMetricas(
	ctx context.Context,
	s tablero.SolicitudMetricasTablero,
) (tablero.MetricasTablero, error) {
	hoy := time.Now().UTC().Format("2006-01-02")

	m := tablero.MetricasTablero{
		Periodo:           tablero.PeriodoMetricas{Inicio: s.FechaInicio, Fin: s.FechaFin},
		Barberos:          []tablero.MetricaBarbero{},
		ServiciosTop:      []tablero.MetricaServicio{},
		InventarioAlertas: []tablero.AlertaInventario{},
	}

	filtroSede := "TRUE"
	argsSede := []any{s.EmpresaID, s.FechaInicio, s.FechaFin}
	if s.SucursalID != "" {
		filtroSede = "r.id_sucursal = $4"
		argsSede = append(argsSede, s.SucursalID)
	}

	// ── 1. Resumen de reservas del período ───────────────────────────────────

	sqlReservas := `
		SELECT
			COUNT(*)                                       AS total,
			COUNT(*) FILTER (WHERE estado = 'COMPLETADA') AS completadas,
			COUNT(*) FILTER (WHERE estado = 'CONFIRMADA') AS confirmadas,
			COUNT(*) FILTER (WHERE estado = 'PENDIENTE')  AS pendientes,
			COUNT(*) FILTER (WHERE estado = 'CANCELADA')  AS canceladas,
			COUNT(*) FILTER (WHERE estado = 'NO_ASISTIO') AS no_asistio
		FROM reserva r
		WHERE r.id_empresa = $1
		  AND r.fecha_hora_inicio::DATE BETWEEN $2 AND $3
		  AND ` + filtroSede

	err := r.pool.QueryRow(ctx, sqlReservas, argsSede...).Scan(
		&m.Reservas.Total, &m.Reservas.Completadas, &m.Reservas.Confirmadas,
		&m.Reservas.Pendientes, &m.Reservas.Canceladas, &m.Reservas.NoAsistio,
	)
	if err != nil {
		return m, err
	}

	atendidas := m.Reservas.Completadas + m.Reservas.NoAsistio
	if atendidas > 0 {
		m.Reservas.TasaCompletado = float64(m.Reservas.Completadas) / float64(atendidas)
	}

	// ── 2. Ingresos del período ──────────────────────────────────────────────

	sqlIngresos := `
		SELECT COALESCE(SUM(rs.precio_acordado), 0)
		FROM reserva r
		JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
		WHERE r.id_empresa = $1
		  AND r.estado = 'COMPLETADA'
		  AND r.fecha_hora_inicio::DATE BETWEEN $2 AND $3
		  AND ` + filtroSede

	err = r.pool.QueryRow(ctx, sqlIngresos, argsSede...).Scan(&m.Ingresos.Total)
	if err != nil {
		return m, err
	}

	// Variación vs período anterior (misma duración de días)
	m.Ingresos.VariacionPct = r.calcularVariacionIngresos(ctx, s, filtroSede, argsSede)

	// ── 3. Clientes ──────────────────────────────────────────────────────────

	err = r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM cliente WHERE id_empresa = $1 AND estado = 'ACTIVO'`,
		s.EmpresaID,
	).Scan(&m.Clientes.Total)
	if err != nil {
		return m, err
	}

	err = r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM cliente
		 WHERE id_empresa = $1 AND creado_en::DATE BETWEEN $2 AND $3 AND estado = 'ACTIVO'`,
		s.EmpresaID, s.FechaInicio, s.FechaFin,
	).Scan(&m.Clientes.Nuevos)
	if err != nil {
		return m, err
	}

	// ── 4. Métricas de hoy ───────────────────────────────────────────────────

	argsHoy := []any{s.EmpresaID, hoy}
	filtroSedeHoy := "TRUE"
	if s.SucursalID != "" {
		filtroSedeHoy = "r.id_sucursal = $3"
		argsHoy = append(argsHoy, s.SucursalID)
	}

	sqlHoy := `
		SELECT
			COUNT(*)                                       AS total,
			COUNT(*) FILTER (WHERE estado = 'COMPLETADA') AS completadas,
			COUNT(*) FILTER (WHERE estado = 'PENDIENTE')  AS pendientes
		FROM reserva r
		WHERE r.id_empresa = $1
		  AND r.fecha_hora_inicio::DATE = $2
		  AND ` + filtroSedeHoy

	err = r.pool.QueryRow(ctx, sqlHoy, argsHoy...).Scan(
		&m.Hoy.ReservasTotal, &m.Hoy.ReservasCompletadas, &m.Hoy.ReservasPendientes,
	)
	if err != nil {
		return m, err
	}

	sqlIngresosHoy := `
		SELECT COALESCE(SUM(rs.precio_acordado), 0)
		FROM reserva r
		JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
		WHERE r.id_empresa = $1
		  AND r.estado = 'COMPLETADA'
		  AND r.fecha_hora_inicio::DATE = $2
		  AND ` + filtroSedeHoy

	err = r.pool.QueryRow(ctx, sqlIngresosHoy, argsHoy...).Scan(&m.Hoy.Ingresos)
	if err != nil {
		return m, err
	}

	// ── 5. Rendimiento por barbero ────────────────────────────────────────────

	sqlBarberos := `
		SELECT
			b.id_barbero,
			b.nombre,
			COUNT(r.id_reserva) FILTER (WHERE r.estado NOT IN ('CANCELADA'))         AS reservas,
			COUNT(r.id_reserva) FILTER (WHERE r.estado = 'COMPLETADA')               AS completadas,
			COUNT(r.id_reserva) FILTER (WHERE r.estado = 'NO_ASISTIO')               AS no_asistio,
			COALESCE(SUM(rs.precio_acordado) FILTER (WHERE r.estado = 'COMPLETADA'), 0) AS ingresos,
			COALESCE(AVG(cb.puntaje), 0)                                              AS rating,
			COALESCE(SUM(c.monto_calculado) FILTER (WHERE c.estado = 'PENDIENTE'), 0) AS comision_pendiente
		FROM barbero b
		LEFT JOIN reserva r
			ON r.id_barbero = b.id_barbero
			AND r.id_empresa = $1
			AND r.fecha_hora_inicio::DATE BETWEEN $2 AND $3
		LEFT JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
		LEFT JOIN resena res ON res.id_reserva = r.id_reserva
		LEFT JOIN calificacion_barbero cb ON cb.id_barbero = b.id_barbero AND cb.id_resena = res.id_resena
		LEFT JOIN comision c ON c.id_barbero = b.id_barbero AND c.estado = 'PENDIENTE'
		WHERE b.id_empresa = $1 AND b.estado = 'ACTIVO'
		GROUP BY b.id_barbero, b.nombre
		ORDER BY ingresos DESC`

	rowsBarberos, err := r.pool.Query(ctx, sqlBarberos, s.EmpresaID, s.FechaInicio, s.FechaFin)
	if err != nil {
		return m, err
	}
	defer rowsBarberos.Close()

	for rowsBarberos.Next() {
		var b tablero.MetricaBarbero
		if err := rowsBarberos.Scan(
			&b.ID, &b.Nombre, &b.Reservas, &b.Completadas, &b.NoAsistio,
			&b.Ingresos, &b.RatingPromedio, &b.ComisionPendiente,
		); err != nil {
			return m, err
		}
		m.Barberos = append(m.Barberos, b)
	}

	// ── 6. Top 5 servicios ───────────────────────────────────────────────────

	sqlServicios := `
		SELECT
			s.id_servicio,
			s.nombre,
			COUNT(rs.id_reserva) AS veces_vendido,
			COALESCE(SUM(rs.precio_acordado), 0) AS ingreso_total
		FROM reserva_servicio rs
		JOIN reserva r ON r.id_reserva = rs.id_reserva
		JOIN servicio s ON s.id_servicio = rs.id_servicio
		WHERE r.id_empresa = $1
		  AND r.estado = 'COMPLETADA'
		  AND r.fecha_hora_inicio::DATE BETWEEN $2 AND $3
		GROUP BY s.id_servicio, s.nombre
		ORDER BY veces_vendido DESC
		LIMIT 5`

	rowsServ, err := r.pool.Query(ctx, sqlServicios, s.EmpresaID, s.FechaInicio, s.FechaFin)
	if err != nil {
		return m, err
	}
	defer rowsServ.Close()

	for rowsServ.Next() {
		var sv tablero.MetricaServicio
		if err := rowsServ.Scan(&sv.ID, &sv.Nombre, &sv.VecesVendido, &sv.IngresoTotal); err != nil {
			return m, err
		}
		m.ServiciosTop = append(m.ServiciosTop, sv)
	}

	// ── 7. Origen de reservas ────────────────────────────────────────────────

	sqlOrigen := `
		SELECT origen, COUNT(*) AS cantidad
		FROM reserva
		WHERE id_empresa = $1
		  AND fecha_hora_inicio::DATE BETWEEN $2 AND $3
		GROUP BY origen`

	rowsOrigen, err := r.pool.Query(ctx, sqlOrigen, s.EmpresaID, s.FechaInicio, s.FechaFin)
	if err != nil {
		return m, err
	}
	defer rowsOrigen.Close()

	for rowsOrigen.Next() {
		var origen string
		var cantidad int
		if err := rowsOrigen.Scan(&origen, &cantidad); err != nil {
			return m, err
		}
		switch origen {
		case "WHATSAPP":
			m.OrigenReservas.WhatsApp = cantidad
		case "WEB":
			m.OrigenReservas.Web = cantidad
		case "MANUAL":
			m.OrigenReservas.Manual = cantidad
		}
	}

	// ── 8. Lealtad ───────────────────────────────────────────────────────────

	err = r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM tarjeta_lealtad tl
		JOIN programa_lealtad pl ON pl.id_programa = tl.id_programa
		WHERE pl.id_empresa = $1 AND tl.estado = 'ACTIVA'`,
		s.EmpresaID,
	).Scan(&m.Lealtad.TarjetasActivas)
	if err != nil {
		return m, err
	}

	err = r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM sello s
		JOIN tarjeta_lealtad tl ON tl.id_tarjeta = s.id_tarjeta_lealtad
		JOIN programa_lealtad pl ON pl.id_programa = tl.id_programa
		WHERE pl.id_empresa = $1
		  AND s.estado = 'VALIDO'
		  AND s.acumulado_en::DATE BETWEEN $2 AND $3`,
		s.EmpresaID, s.FechaInicio, s.FechaFin,
	).Scan(&m.Lealtad.SellosAcumulados)
	if err != nil {
		return m, err
	}

	err = r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM tarjeta_lealtad tl
		JOIN programa_lealtad pl ON pl.id_programa = tl.id_programa
		LEFT JOIN (
			SELECT id_tarjeta_lealtad,
			       COUNT(*) FILTER (WHERE estado = 'VALIDO') AS validos
			FROM sello GROUP BY id_tarjeta_lealtad
		) sc ON sc.id_tarjeta_lealtad = tl.id_tarjeta
		WHERE pl.id_empresa = $1
		  AND tl.estado = 'ACTIVA'
		  AND COALESCE(sc.validos, 0) >= pl.sellos_para_recompensa`,
		s.EmpresaID,
	).Scan(&m.Lealtad.ListosParaCanjear)
	if err != nil {
		return m, err
	}

	err = r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM canje_recompensa cr
		JOIN tarjeta_lealtad tl ON tl.id_tarjeta = cr.id_tarjeta_lealtad
		JOIN programa_lealtad pl ON pl.id_programa = tl.id_programa
		WHERE pl.id_empresa = $1
		  AND cr.estado = 'APLICADO'
		  AND cr.canjeado_en::DATE BETWEEN $2 AND $3`,
		s.EmpresaID, s.FechaInicio, s.FechaFin,
	).Scan(&m.Lealtad.CanjesPeriodo)
	if err != nil {
		return m, err
	}

	// ── 9. Alertas de inventario bajo ───────────────────────────────────────

	sqlStock := `
		SELECT p.id_producto, p.nombre, ss.cantidad_actual, ss.cantidad_minima
		FROM stock_sucursal ss
		JOIN producto p ON p.id_producto = ss.id_producto
		JOIN sucursal su ON su.id_sucursal = ss.id_sucursal
		WHERE su.id_empresa = $1
		  AND ss.cantidad_actual <= ss.cantidad_minima
		  AND p.estado = 'ACTIVO'
		ORDER BY (ss.cantidad_actual / NULLIF(ss.cantidad_minima, 0)) ASC
		LIMIT 10`

	rowsStock, err := r.pool.Query(ctx, sqlStock, s.EmpresaID)
	if err != nil {
		return m, err
	}
	defer rowsStock.Close()

	for rowsStock.Next() {
		var a tablero.AlertaInventario
		if err := rowsStock.Scan(&a.ID, &a.Nombre, &a.CantidadActual, &a.CantidadMinima); err != nil {
			return m, err
		}
		m.InventarioAlertas = append(m.InventarioAlertas, a)
	}

	// ── 10. Comisiones pendientes totales ────────────────────────────────────

	err = r.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(c.monto_calculado), 0)
		FROM comision c
		JOIN barbero b ON b.id_barbero = c.id_barbero
		WHERE b.id_empresa = $1 AND c.estado = 'PENDIENTE'`,
		s.EmpresaID,
	).Scan(&m.ComisionesPendientes)
	if err != nil {
		return m, err
	}

	return m, nil
}

// calcularVariacionIngresos compara ingresos actuales vs el período inmediatamente anterior.
func (r *RepositorioTableroCockroach) calcularVariacionIngresos(
	ctx context.Context,
	s tablero.SolicitudMetricasTablero,
	filtroSede string,
	argsSede []any,
) float64 {
	layout := "2006-01-02"
	inicio, errI := time.Parse(layout, s.FechaInicio)
	fin, errF := time.Parse(layout, s.FechaFin)
	if errI != nil || errF != nil {
		return 0
	}

	duracion := fin.Sub(inicio)
	inicioPrev := inicio.Add(-duracion - 24*time.Hour)
	finPrev := inicio.Add(-24 * time.Hour)

	argsPrev := []any{s.EmpresaID, inicioPrev.Format(layout), finPrev.Format(layout)}
	if s.SucursalID != "" {
		argsPrev = append(argsPrev, s.SucursalID)
	}
	_ = argsSede // silenciar warning; argsPrev reconstruye el slice

	sqlPrev := `
		SELECT COALESCE(SUM(rs.precio_acordado), 0)
		FROM reserva r
		JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
		WHERE r.id_empresa = $1
		  AND r.estado = 'COMPLETADA'
		  AND r.fecha_hora_inicio::DATE BETWEEN $2 AND $3
		  AND ` + filtroSede

	var ingresosPrev float64
	if err := r.pool.QueryRow(ctx, sqlPrev, argsPrev...).Scan(&ingresosPrev); err != nil || ingresosPrev == 0 {
		return 0
	}

	var ingresosActuales float64
	argsActuales := []any{s.EmpresaID, s.FechaInicio, s.FechaFin}
	if s.SucursalID != "" {
		argsActuales = append(argsActuales, s.SucursalID)
	}

	sqlActual := `
		SELECT COALESCE(SUM(rs.precio_acordado), 0)
		FROM reserva r
		JOIN reserva_servicio rs ON rs.id_reserva = r.id_reserva
		WHERE r.id_empresa = $1
		  AND r.estado = 'COMPLETADA'
		  AND r.fecha_hora_inicio::DATE BETWEEN $2 AND $3
		  AND ` + filtroSede

	if err := r.pool.QueryRow(ctx, sqlActual, argsActuales...).Scan(&ingresosActuales); err != nil {
		return 0
	}

	return ((ingresosActuales - ingresosPrev) / ingresosPrev) * 100
}
