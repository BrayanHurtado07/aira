package cockroach

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"aira/capacidades/agenda/barberos"
	"aira/capacidades/agenda/disponibilidad"
	"aira/capacidades/agenda/excepciones"
	"aira/capacidades/agenda/servicios"
	"aira/capacidades/agenda/tarifas"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

// formatearHora convierte time.Time (o string HH:MM:SS…) a "HH:MM"
func formatearHora(t time.Time) string {
	return t.Format("15:04")
}

// recortarHora toma un string "HH:MM:SS.fff" y devuelve "HH:MM"
func recortarHora(s string) string {
	if idx := strings.Index(s, ":"); idx >= 0 {
		partes := strings.Split(s, ":")
		if len(partes) >= 2 {
			return partes[0] + ":" + partes[1]
		}
	}
	return s
}

type RepositorioBarberosCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioBarbero(pool *pgxpool.Pool) *RepositorioBarberosCockroach {
	return &RepositorioBarberosCockroach{pool: pool}
}

func (r *RepositorioBarberosCockroach) ObtenerActivo(ctx context.Context, id string) (barberos.Barbero, error) {
	var b barberos.Barbero
	var usuarioID, telefono *string
	err := r.pool.QueryRow(ctx,
		`SELECT id_barbero, id_empresa, nombre, telefono, id_usuario, estado
		 FROM barbero WHERE id_barbero = $1 AND estado = 'ACTIVO'`,
		id,
	).Scan(&b.ID, &b.EmpresaID, &b.Nombre, &telefono, &usuarioID, &b.Estado)
	if err != nil {
		return barberos.Barbero{}, errores.ErrBarberoNoActivo
	}
	if usuarioID != nil {
		b.UsuarioID = *usuarioID
	}
	if telefono != nil {
		b.Telefono = *telefono
	}
	return b, nil
}

func (r *RepositorioBarberosCockroach) Guardar(ctx context.Context, b barberos.Barbero, fotoURL string) (string, error) {
	usuarioID := any(b.UsuarioID)
	if b.UsuarioID == "" {
		usuarioID = nil
	}
	foto := any(fotoURL)
	if fotoURL == "" {
		foto = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "barbero_registrar",
		b.EmpresaID, b.Nombre, b.Telefono, usuarioID, foto, nil)
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
	return ExtraerCampo(resultado.Datos, "id_barbero"), nil
}

// BarberoDisponible es un barbero libre para un turno concreto (lectura de agenda).
type BarberoDisponible struct {
	ID     string `json:"id"`
	Nombre string `json:"nombre"`
}

// BarberosDisponiblesPorSede responde "¿qué barberos están libres en esta sede,
// a esta fecha/hora, para este servicio?" delegando en la función de dominio
// barberos_disponibles_por_sede (que respeta disponibilidad, excepciones y solapes).
func (r *RepositorioBarberosCockroach) BarberosDisponiblesPorSede(
	ctx context.Context, empresaID, sucursalID, servicioID, fechaHoraInicio string,
) ([]BarberoDisponible, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT id_barbero, nombre
		 FROM barberos_disponibles_por_sede($1, $2, $3, $4)`,
		empresaID, sucursalID, servicioID, fechaHoraInicio,
	)
	if err != nil {
		return nil, err
	}
	defer filas.Close()

	disponibles := []BarberoDisponible{}
	for filas.Next() {
		var b BarberoDisponible
		if err := filas.Scan(&b.ID, &b.Nombre); err != nil {
			return nil, err
		}
		disponibles = append(disponibles, b)
	}
	return disponibles, filas.Err()
}

// ActualizarBarbero actualiza nombre y teléfono de un barbero existente.
func (r *RepositorioBarberosCockroach) ActualizarBarbero(ctx context.Context, barberoID, nombre, telefono string) error {
	tel := any(telefono)
	if telefono == "" {
		tel = nil
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE barbero SET nombre = $1, telefono = $2 WHERE id_barbero = $3`,
		nombre, tel, barberoID,
	)
	return err
}

// ActualizarEstadoBarbero cambia el estado de un barbero (ACTIVO / INACTIVO).
func (r *RepositorioBarberosCockroach) ActualizarEstadoBarbero(ctx context.Context, barberoID, estado string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE barbero SET estado = $1 WHERE id_barbero = $2`,
		estado, barberoID,
	)
	return err
}

func (r *RepositorioBarberosCockroach) AsignarServicio(ctx context.Context, barberoID, servicioID string) error {
	resultado, err := LlamarProc(ctx, r.pool, "barbero_servicio_asignar", barberoID, servicioID, nil)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

// DesasignarServicio elimina la relación entre un barbero y un servicio.
func (r *RepositorioBarberosCockroach) DesasignarServicio(ctx context.Context, barberoID, servicioID string) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM barbero_servicio WHERE id_barbero = $1 AND id_servicio = $2`,
		barberoID, servicioID,
	)
	return err
}

func (r *RepositorioBarberosCockroach) ListarActivos(ctx context.Context, empresaID string) ([]barberos.Barbero, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_barbero, id_empresa, nombre, telefono, id_usuario, estado
		 FROM barbero WHERE id_empresa = $1 AND estado = 'ACTIVO' ORDER BY nombre`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []barberos.Barbero{}
	for rows.Next() {
		var b barberos.Barbero
		var usuarioID, telefono *string
		if err := rows.Scan(&b.ID, &b.EmpresaID, &b.Nombre, &telefono, &usuarioID, &b.Estado); err != nil {
			return nil, err
		}
		if usuarioID != nil {
			b.UsuarioID = *usuarioID
		}
		if telefono != nil {
			b.Telefono = *telefono
		}
		resultado = append(resultado, b)
	}
	return resultado, nil
}

// ListarActivosPorServicio devuelve los barberos activos que SABEN realizar un
// servicio (vía barbero_servicio). Regla de negocio: no ofrecer un barbero que no
// hace el servicio elegido.
func (r *RepositorioBarberosCockroach) ListarActivosPorServicio(ctx context.Context, empresaID, servicioID string) ([]barberos.Barbero, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT b.id_barbero, b.id_empresa, b.nombre, b.telefono, b.id_usuario, b.estado
		 FROM barbero b
		 JOIN barbero_servicio bs ON bs.id_barbero = b.id_barbero
		 WHERE b.id_empresa = $1 AND b.estado = 'ACTIVO' AND bs.id_servicio = $2
		 ORDER BY b.nombre`,
		empresaID, servicioID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []barberos.Barbero{}
	for rows.Next() {
		var b barberos.Barbero
		var usuarioID, telefono *string
		if err := rows.Scan(&b.ID, &b.EmpresaID, &b.Nombre, &telefono, &usuarioID, &b.Estado); err != nil {
			return nil, err
		}
		if usuarioID != nil {
			b.UsuarioID = *usuarioID
		}
		if telefono != nil {
			b.Telefono = *telefono
		}
		resultado = append(resultado, b)
	}
	return resultado, nil
}

// ListarServiciosBarbero devuelve los servicios activos asignados a un barbero.
func (r *RepositorioBarberosCockroach) ListarServiciosBarbero(ctx context.Context, barberoID string) ([]servicios.Servicio, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT s.id_servicio, s.id_empresa, s.nombre, s.duracion_minutos, s.precio_base,
		        COALESCE(s.descripcion, ''), s.estado
		 FROM servicio s
		 JOIN barbero_servicio bs ON bs.id_servicio = s.id_servicio
		 WHERE bs.id_barbero = $1 AND s.estado = 'ACTIVO'
		 ORDER BY s.nombre`,
		barberoID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []servicios.Servicio{}
	for rows.Next() {
		var s servicios.Servicio
		if err := rows.Scan(&s.ID, &s.EmpresaID, &s.Nombre, &s.DuracionMinutos, &s.PrecioBase, &s.Descripcion, &s.Estado); err != nil {
			return nil, err
		}
		resultado = append(resultado, s)
	}
	return resultado, nil
}

// ObtenerPrimeraSucursalActiva devuelve el id de la primera sucursal activa de una empresa.
// Se usa como fallback cuando la solicitud no trae sucursal_id.
func (r *RepositorioDisponibilidadCockroach) ObtenerPrimeraSucursalActiva(ctx context.Context, empresaID string) string {
	var id string
	_ = r.pool.QueryRow(ctx,
		`SELECT id_sucursal FROM sucursal WHERE id_empresa = $1 AND estado = 'ACTIVO' ORDER BY nombre LIMIT 1`,
		empresaID,
	).Scan(&id)
	return id
}

// ── RepositorioServicioCockroach ─────────────────────────────────────────────

type RepositorioServicioCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioServicio(pool *pgxpool.Pool) *RepositorioServicioCockroach {
	return &RepositorioServicioCockroach{pool: pool}
}

func (r *RepositorioServicioCockroach) ObtenerActivo(ctx context.Context, id string) (servicios.Servicio, error) {
	var s servicios.Servicio
	var desc *string
	err := r.pool.QueryRow(ctx,
		`SELECT id_servicio, id_empresa, nombre, duracion_minutos, precio_base, descripcion, estado
		 FROM servicio WHERE id_servicio = $1 AND estado = 'ACTIVO'`,
		id,
	).Scan(&s.ID, &s.EmpresaID, &s.Nombre, &s.DuracionMinutos, &s.PrecioBase, &desc, &s.Estado)
	if err != nil {
		return servicios.Servicio{}, errores.ErrServicioNoActivo
	}
	if desc != nil {
		s.Descripcion = *desc
	}
	return s, nil
}

func (r *RepositorioServicioCockroach) Guardar(ctx context.Context, s servicios.Servicio) (string, error) {
	desc := any(s.Descripcion)
	if s.Descripcion == "" {
		desc = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "servicio_crear",
		s.EmpresaID, s.Nombre, s.DuracionMinutos, s.PrecioBase, desc, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_servicio"), nil
}

func (r *RepositorioServicioCockroach) ListarActivos(ctx context.Context, empresaID string) ([]servicios.Servicio, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_servicio, id_empresa, nombre, duracion_minutos, precio_base, descripcion, estado
		 FROM servicio WHERE id_empresa = $1 AND estado = 'ACTIVO' ORDER BY nombre`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []servicios.Servicio{}
	for rows.Next() {
		var s servicios.Servicio
		var desc *string
		if err := rows.Scan(&s.ID, &s.EmpresaID, &s.Nombre, &s.DuracionMinutos, &s.PrecioBase, &desc, &s.Estado); err != nil {
			return nil, err
		}
		if desc != nil {
			s.Descripcion = *desc
		}
		resultado = append(resultado, s)
	}
	return resultado, nil
}

// ListarTodos devuelve todos los servicios (incluyendo INACTIVO) para la vista de administración.
func (r *RepositorioServicioCockroach) ListarTodos(ctx context.Context, empresaID string) ([]servicios.Servicio, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_servicio, id_empresa, nombre, duracion_minutos, precio_base, descripcion, estado
		 FROM servicio WHERE id_empresa = $1 ORDER BY nombre`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []servicios.Servicio{}
	for rows.Next() {
		var s servicios.Servicio
		var desc *string
		if err := rows.Scan(&s.ID, &s.EmpresaID, &s.Nombre, &s.DuracionMinutos, &s.PrecioBase, &desc, &s.Estado); err != nil {
			return nil, err
		}
		if desc != nil {
			s.Descripcion = *desc
		}
		resultado = append(resultado, s)
	}
	return resultado, nil
}

// ActualizarServicio modifica el nombre, duración y precio de un servicio existente.
func (r *RepositorioServicioCockroach) ActualizarServicio(ctx context.Context, servicioID, nombre string, duracionMinutos int, precio float64) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE servicio SET nombre = $1, duracion_minutos = $2, precio_base = $3 WHERE id_servicio = $4`,
		nombre, duracionMinutos, precio, servicioID,
	)
	return err
}

// ActualizarEstadoServicio cambia el estado de un servicio (ACTIVO / INACTIVO).
func (r *RepositorioServicioCockroach) ActualizarEstadoServicio(ctx context.Context, servicioID, estado string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE servicio SET estado = $1 WHERE id_servicio = $2`,
		estado, servicioID,
	)
	return err
}

// RepositorioDisponibilidadCockroach

type RepositorioDisponibilidadCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioDisponibilidad(pool *pgxpool.Pool) *RepositorioDisponibilidadCockroach {
	return &RepositorioDisponibilidadCockroach{pool: pool}
}

func (r *RepositorioDisponibilidadCockroach) Registrar(ctx context.Context, bloque disponibilidad.BloqueDisponibilidad) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "disponibilidad_registrar",
		bloque.BarberoID, bloque.SucursalID, bloque.DiaSemana,
		bloque.HoraInicio, bloque.HoraFin, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_disponibilidad"), nil
}

// EliminarBloque borra un bloque de disponibilidad, validando que pertenezca a la
// empresa (tenant). Permite corregir un horario mal cargado.
func (r *RepositorioDisponibilidadCockroach) EliminarBloque(ctx context.Context, disponibilidadID, empresaID string) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM disponibilidad
		 WHERE id_disponibilidad = $1
		   AND id_barbero IN (SELECT id_barbero FROM barbero WHERE id_empresa = $2)`,
		disponibilidadID, empresaID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errores.ErrBarberoNoDisponible
	}
	return nil
}

func (r *RepositorioDisponibilidadCockroach) ObtenerPorID(ctx context.Context, disponibilidadID string) (disponibilidad.BloqueDisponibilidad, error) {
	var b disponibilidad.BloqueDisponibilidad
	var hi, hf string
	err := r.pool.QueryRow(ctx,
		`SELECT id_disponibilidad, id_barbero, id_sucursal, dia_semana, hora_inicio, hora_fin
		 FROM disponibilidad WHERE id_disponibilidad = $1`,
		disponibilidadID,
	).Scan(&b.ID, &b.BarberoID, &b.SucursalID, &b.DiaSemana, &hi, &hf)
	if err != nil {
		return disponibilidad.BloqueDisponibilidad{}, errores.ErrBarberoNoDisponible
	}
	b.HoraInicio = recortarHora(hi)
	b.HoraFin = recortarHora(hf)
	return b, nil
}

func (r *RepositorioDisponibilidadCockroach) MarcarReservada(ctx context.Context, disponibilidadID string) error {
	resultado, err := LlamarProc(ctx, r.pool, "disponibilidad_marcar_reservada", disponibilidadID, nil)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

func (r *RepositorioDisponibilidadCockroach) LiberarBloque(ctx context.Context, disponibilidadID string) error {
	resultado, err := LlamarProc(ctx, r.pool, "disponibilidad_liberar", disponibilidadID, nil)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

// ListarLibres devuelve bloques disponibles para una sede en una fecha dada.
// Filtra por día de semana derivado de la fecha y excluye bloques con reservas activas.
func (r *RepositorioDisponibilidadCockroach) ListarLibres(ctx context.Context, sucursalID, fecha string) ([]disponibilidad.BloqueDisponibilidad, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT d.id_disponibilidad, d.id_barbero, d.id_sucursal, d.dia_semana, d.hora_inicio, d.hora_fin
		 FROM disponibilidad d
		 WHERE d.id_sucursal = $1
		   AND d.dia_semana = EXTRACT(DOW FROM $2::DATE)::INT
		   AND NOT EXISTS (
		     SELECT 1 FROM reserva r
		     WHERE r.id_barbero = d.id_barbero
		       AND r.fecha_hora_inicio::DATE = $2::DATE
		       AND r.fecha_hora_inicio::TIME >= d.hora_inicio::TIME
		       AND r.fecha_hora_inicio::TIME <  d.hora_fin::TIME
		       AND r.estado NOT IN ('CANCELADA', 'NO_ASISTIO')
		   )`,
		sucursalID, fecha,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bloques []disponibilidad.BloqueDisponibilidad
	for rows.Next() {
		var b disponibilidad.BloqueDisponibilidad
		var hi, hf string
		if err := rows.Scan(&b.ID, &b.BarberoID, &b.SucursalID, &b.DiaSemana, &hi, &hf); err != nil {
			return nil, err
		}
		b.HoraInicio = recortarHora(hi)
		b.HoraFin = recortarHora(hf)
		bloques = append(bloques, b)
	}
	return bloques, nil
}

func (r *RepositorioDisponibilidadCockroach) ListarPorBarbero(ctx context.Context, barberoID string) ([]disponibilidad.BloqueDisponibilidad, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_disponibilidad, id_barbero, id_sucursal, dia_semana, hora_inicio, hora_fin
		 FROM disponibilidad WHERE id_barbero = $1 ORDER BY dia_semana, hora_inicio`,
		barberoID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []disponibilidad.BloqueDisponibilidad{}
	for rows.Next() {
		var b disponibilidad.BloqueDisponibilidad
		var hi, hf string
		if err := rows.Scan(&b.ID, &b.BarberoID, &b.SucursalID, &b.DiaSemana, &hi, &hf); err != nil {
			return nil, err
		}
		b.HoraInicio = recortarHora(hi)
		b.HoraFin = recortarHora(hf)
		resultado = append(resultado, b)
	}
	return resultado, nil
}

func (r *RepositorioDisponibilidadCockroach) ObtenerPorBarberoYDia(ctx context.Context, barberoID string, diaSemana int) ([]disponibilidad.BloqueDisponibilidad, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_disponibilidad, id_barbero, id_sucursal, dia_semana, hora_inicio, hora_fin
		 FROM disponibilidad WHERE id_barbero = $1 AND dia_semana = $2`,
		barberoID, diaSemana,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resultado []disponibilidad.BloqueDisponibilidad
	for rows.Next() {
		var b disponibilidad.BloqueDisponibilidad
		var hi, hf string
		if err := rows.Scan(&b.ID, &b.BarberoID, &b.SucursalID, &b.DiaSemana, &hi, &hf); err != nil {
			return nil, err
		}
		b.HoraInicio = recortarHora(hi)
		b.HoraFin = recortarHora(hf)
		resultado = append(resultado, b)
	}
	return resultado, nil
}

// ─── Consulta de slots disponibles ──────────────────────────────────────────

type RespuestaConsultarSlots struct {
	Fecha           string   `json:"fecha"`
	DuracionMinutos int      `json:"duracion_minutos"`
	SucursalID      string   `json:"sucursal_id"`
	Slots           []string `json:"slots"`
}

// ConsultarSlots calcula los horarios disponibles para un barbero/servicio/fecha.
// Genera franjas de duración del servicio dentro de cada bloque de disponibilidad
// y descarta las que se solapan con reservas ya existentes.
func (r *RepositorioDisponibilidadCockroach) ConsultarSlots(
	ctx context.Context,
	barberoID, servicioID, fecha string,
) (RespuestaConsultarSlots, error) {
	// 1. Duración del servicio
	var duracion int
	if err := r.pool.QueryRow(ctx,
		`SELECT duracion_minutos FROM servicio WHERE id_servicio = $1 AND estado = 'ACTIVO'`,
		servicioID,
	).Scan(&duracion); err != nil {
		return RespuestaConsultarSlots{}, fmt.Errorf("servicio_no_encontrado")
	}

	// 2. Calcular dia_semana (0=Dom … 6=Sáb, igual que Go time.Weekday y SQL EXTRACT(DOW))
	fechaParsed, err := time.Parse("2006-01-02", fecha)
	if err != nil {
		return RespuestaConsultarSlots{}, fmt.Errorf("fecha_invalida")
	}
	diaSemana := int(fechaParsed.Weekday())

	// 3. Bloques de disponibilidad del barbero para ese día
	type bloqueHorario struct {
		sucursalID string
		horaInicio string
		horaFin    string
	}

	rows, err := r.pool.Query(ctx,
		`SELECT d.id_sucursal, d.hora_inicio, d.hora_fin,
		        COALESCE(s.zona_horaria, 'UTC')
		 FROM disponibilidad d
		 LEFT JOIN sucursal s ON s.id_sucursal = d.id_sucursal
		 WHERE d.id_barbero = $1 AND d.dia_semana = $2 AND d.estado = 'ACTIVO'`,
		barberoID, diaSemana,
	)
	if err != nil {
		return RespuestaConsultarSlots{}, err
	}
	defer rows.Close()

	var bloques []bloqueHorario
	var zonaHoraria, sucursalID string
	for rows.Next() {
		var b bloqueHorario
		var tz, hi, hf string
		if err := rows.Scan(&b.sucursalID, &hi, &hf, &tz); err != nil {
			return RespuestaConsultarSlots{}, err
		}
		b.horaInicio = recortarHora(hi)
		b.horaFin = recortarHora(hf)
		if zonaHoraria == "" {
			zonaHoraria = tz
			sucursalID = b.sucursalID
		}
		bloques = append(bloques, b)
	}
	rows.Close()

	if len(bloques) == 0 {
		return RespuestaConsultarSlots{
			Fecha:           fecha,
			DuracionMinutos: duracion,
			Slots:           []string{},
		}, nil
	}

	// 4. Zona horaria de la sucursal para construir instantes correctos
	loc, err := time.LoadLocation(zonaHoraria)
	if err != nil {
		loc = time.UTC
	}

	// 5. Reservas existentes del barbero en esa fecha (comparando en hora local)
	rows2, err := r.pool.Query(ctx,
		`SELECT fecha_hora_inicio, fecha_hora_fin FROM reserva
		 WHERE id_barbero = $1
		   AND (fecha_hora_inicio AT TIME ZONE $3)::DATE = $2::DATE
		   AND estado NOT IN ('CANCELADA', 'NO_ASISTIO')`,
		barberoID, fecha, zonaHoraria,
	)
	if err != nil {
		return RespuestaConsultarSlots{}, err
	}
	defer rows2.Close()

	type reservaOcupada struct{ inicio, fin time.Time }
	var ocupadas []reservaOcupada
	for rows2.Next() {
		var ini, fin time.Time
		if err := rows2.Scan(&ini, &fin); err != nil {
			return RespuestaConsultarSlots{}, err
		}
		ocupadas = append(ocupadas, reservaOcupada{ini, fin})
	}
	rows2.Close()

	// 6. Generar franjas y filtrar solapamientos
	ahora := time.Now()
	var slots []string

	for _, bloque := range bloques {
		hiMin := parsearMinutos(bloque.horaInicio)
		hfMin := parsearMinutos(bloque.horaFin)

		for cur := hiMin; cur+duracion <= hfMin; cur += duracion {
			finMin := cur + duracion
			slotInicio := time.Date(
				fechaParsed.Year(), fechaParsed.Month(), fechaParsed.Day(),
				cur/60, cur%60, 0, 0, loc,
			)
			slotFin := time.Date(
				fechaParsed.Year(), fechaParsed.Month(), fechaParsed.Day(),
				finMin/60, finMin%60, 0, 0, loc,
			)

			if !slotInicio.After(ahora) {
				continue
			}

			solapado := false
			for _, occ := range ocupadas {
				if slotInicio.Before(occ.fin) && slotFin.After(occ.inicio) {
					solapado = true
					break
				}
			}
			if !solapado {
				slots = append(slots, fmt.Sprintf("%02d:%02d", cur/60, cur%60))
			}
		}
	}

	if slots == nil {
		slots = []string{}
	}

	return RespuestaConsultarSlots{
		Fecha:           fecha,
		DuracionMinutos: duracion,
		SucursalID:      sucursalID,
		Slots:           slots,
	}, nil
}

// parsearMinutos convierte "HH:MM" en minutos desde medianoche.
func parsearMinutos(hora string) int {
	partes := strings.Split(hora, ":")
	if len(partes) < 2 {
		return 0
	}
	h, _ := strconv.Atoi(partes[0])
	m, _ := strconv.Atoi(partes[1])
	return h*60 + m
}

// ── RepositorioExcepcionDisponibilidadCockroach ──────────────────────────────

var _ excepciones.RepositorioExcepcionDisponibilidad = (*RepositorioExcepcionDisponibilidadCockroach)(nil)

type RepositorioExcepcionDisponibilidadCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioExcepcionDisponibilidad(pool *pgxpool.Pool) *RepositorioExcepcionDisponibilidadCockroach {
	return &RepositorioExcepcionDisponibilidadCockroach{pool: pool}
}

// Registrar llama al stored proc excepcion_disponibilidad_registrar.
func (r *RepositorioExcepcionDisponibilidadCockroach) Registrar(
	ctx context.Context,
	e excepciones.ExcepcionDisponibilidad,
) (string, error) {
	desc := any(e.Descripcion)
	if e.Descripcion == "" {
		desc = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "excepcion_disponibilidad_registrar",
		e.BarberoID, e.SucursalID, e.Fecha, e.Motivo, desc, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		if resultado.Error == "EXCEPCION_YA_REGISTRADA_PARA_ESA_FECHA" {
			return "", errores.ErrExcepcionYaRegistrada
		}
		if resultado.Error == "BARBERO_NO_ACTIVO" {
			return "", errores.ErrBarberoNoActivo
		}
		if resultado.Error == "SUCURSAL_NO_ACTIVA" {
			return "", errores.ErrSucursalNoActiva
		}
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_excepcion"), nil
}

// ListarPorBarbero devuelve todas las excepciones de un barbero ordenadas por fecha.
func (r *RepositorioExcepcionDisponibilidadCockroach) ListarPorBarbero(
	ctx context.Context,
	barberoID string,
) ([]excepciones.ExcepcionDisponibilidad, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_excepcion, id_barbero, id_sucursal, fecha::TEXT, motivo,
		        COALESCE(descripcion, ''), creado_en::TEXT
		 FROM excepcion_disponibilidad
		 WHERE id_barbero = $1
		 ORDER BY fecha DESC`,
		barberoID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []excepciones.ExcepcionDisponibilidad{}
	for rows.Next() {
		var ex excepciones.ExcepcionDisponibilidad
		if err := rows.Scan(&ex.ID, &ex.BarberoID, &ex.SucursalID, &ex.Fecha,
			&ex.Motivo, &ex.Descripcion, &ex.CreadoEn); err != nil {
			return nil, err
		}
		resultado = append(resultado, ex)
	}
	return resultado, nil
}

// Eliminar borra físicamente una excepción de disponibilidad (es un bloqueo de control, no un registro de negocio).
func (r *RepositorioExcepcionDisponibilidadCockroach) Eliminar(
	ctx context.Context,
	excepcionID string,
) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM excepcion_disponibilidad WHERE id_excepcion = $1`,
		excepcionID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errores.ErrBarberoNoDisponible // excepción no encontrada
	}
	return nil
}

// ── RepositorioTarifaEspecialCockroach ───────────────────────────────────────

var _ tarifas.RepositorioTarifaEspecial = (*RepositorioTarifaEspecialCockroach)(nil)

type RepositorioTarifaEspecialCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioTarifaEspecial(pool *pgxpool.Pool) *RepositorioTarifaEspecialCockroach {
	return &RepositorioTarifaEspecialCockroach{pool: pool}
}

func (r *RepositorioTarifaEspecialCockroach) Crear(
	ctx context.Context,
	t tarifas.TarifaEspecial,
	creadoPor string,
) (string, error) {
	motivo := any(t.Motivo)
	if t.Motivo == "" {
		motivo = nil
	}
	cp := any(creadoPor)
	if creadoPor == "" {
		cp = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "tarifa_especial_crear",
		t.SucursalID, t.ServicioID, t.Fecha, t.PrecioEspecial, motivo, cp)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "TARIFA_ESPECIAL_YA_EXISTE_PARA_ESA_FECHA":
			return "", errores.ErrTarifaYaExiste
		case "SUCURSAL_NO_ACTIVA":
			return "", errores.ErrSucursalNoActiva
		case "SERVICIO_NO_VALIDO":
			return "", errores.ErrServicioNoActivo
		}
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_tarifa"), nil
}

func (r *RepositorioTarifaEspecialCockroach) ListarPorSucursal(
	ctx context.Context,
	sucursalID string,
) ([]tarifas.TarifaEspecial, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_tarifa, id_sucursal, id_servicio,
		        fecha::TEXT, precio_especial, COALESCE(motivo, '')
		 FROM tarifa_especial
		 WHERE id_sucursal = $1
		 ORDER BY fecha`,
		sucursalID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []tarifas.TarifaEspecial{}
	for rows.Next() {
		var t tarifas.TarifaEspecial
		if err := rows.Scan(&t.ID, &t.SucursalID, &t.ServicioID,
			&t.Fecha, &t.PrecioEspecial, &t.Motivo); err != nil {
			return nil, err
		}
		resultado = append(resultado, t)
	}
	return resultado, nil
}

func (r *RepositorioTarifaEspecialCockroach) Eliminar(
	ctx context.Context,
	tarifaID string,
) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM tarifa_especial WHERE id_tarifa = $1`,
		tarifaID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errores.ErrServicioNoExiste
	}
	return nil
}
