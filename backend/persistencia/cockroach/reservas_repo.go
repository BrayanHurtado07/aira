package cockroach

import (
	"context"
	"fmt"
	"time"

	"aira/capacidades/reservas"
	"aira/capacidades/reservas/clientes"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RepositorioReservaCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioReserva(pool *pgxpool.Pool) *RepositorioReservaCockroach {
	return &RepositorioReservaCockroach{pool: pool}
}

func (r *RepositorioReservaCockroach) Guardar(ctx context.Context, s reservas.SolicitudGuardarReserva) (reservas.Reserva, error) {
	creadoPor := any(s.CreadoPor)
	if s.CreadoPor == "" {
		creadoPor = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "reserva_crear",
		s.EmpresaID, s.SucursalID, s.ClienteID, s.BarberoID, s.ServicioID,
		s.FechaHoraInicio, s.Origen, creadoPor)
	if err != nil {
		return reservas.Reserva{}, err
	}
	if !resultado.Exito {
		return reservas.Reserva{}, mapearErrorReserva(resultado.Error)
	}

	id := ExtraerCampo(resultado.Datos, "id_reserva")
	estado := ExtraerCampo(resultado.Datos, "estado")

	return reservas.Reserva{
		ID:             id,
		EmpresaID:      s.EmpresaID,
		SucursalID:     s.SucursalID,
		ClienteID:      s.ClienteID,
		BarberoID:      s.BarberoID,
		FechaHoraInicio: s.FechaHoraInicio,
		Estado:         reservas.EstadoReserva(estado),
		Origen:         s.Origen,
	}, nil
}

func (r *RepositorioReservaCockroach) ObtenerPorID(ctx context.Context, id string) (reservas.Reserva, error) {
	var rv reservas.Reserva
	var fechaHoraInicio time.Time
	err := r.pool.QueryRow(ctx,
		`SELECT id_reserva, id_empresa, id_sucursal, id_cliente, id_barbero, fecha_hora_inicio, estado, origen
		 FROM reserva WHERE id_reserva = $1`,
		id,
	).Scan(&rv.ID, &rv.EmpresaID, &rv.SucursalID, &rv.ClienteID, &rv.BarberoID,
		&fechaHoraInicio, &rv.Estado, &rv.Origen)
	if err != nil {
		return reservas.Reserva{}, errores.ErrReservaNoExiste
	}
	rv.FechaHoraInicio = fechaHoraInicio.UTC().Format(time.RFC3339)
	return rv, nil
}

func (r *RepositorioReservaCockroach) Confirmar(ctx context.Context, id, confirmadoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "reserva_confirmar", id, confirmadoPor)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return mapearErrorReserva(resultado.Error)
	}
	return nil
}

func (r *RepositorioReservaCockroach) Cancelar(ctx context.Context, id, canceladoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "reserva_cancelar", id, canceladoPor)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return mapearErrorReserva(resultado.Error)
	}
	return nil
}

func (r *RepositorioReservaCockroach) Completar(ctx context.Context, id, completadoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "reserva_completar", id, completadoPor)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return mapearErrorReserva(resultado.Error)
	}
	return nil
}

func (r *RepositorioReservaCockroach) MarcarNoAsistio(ctx context.Context, id, marcadoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "reserva_marcar_no_asistio", id, marcadoPor)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return mapearErrorReserva(resultado.Error)
	}
	return nil
}

func mapearErrorReserva(codigo string) error {
	switch codigo {
	// Estados de reserva
	case "RESERVA_NO_EXISTE":
		return errores.ErrReservaNoExiste
	case "RESERVA_NO_CONFIRMABLE", "RESERVA_NO_PENDIENTE":
		return errores.ErrReservaNoConfirmable
	case "RESERVA_YA_CERRADA", "RESERVA_NO_CANCELABLE":
		return errores.ErrReservaYaCerrada
	case "RESERVA_NO_COMPLETABLE", "RESERVA_NO_CONFIRMADA":
		return errores.ErrReservaNoCompletable
	case "SIN_DISPONIBILIDAD":
		return errores.ErrSinDisponibilidad
	// Validaciones del dominio en reserva_crear
	case "EMPRESA_NO_ACTIVA":
		return errores.ErrEmpresaNoActiva
	case "EMPRESA_SIN_SUSCRIPCION_ACTIVA":
		return errores.ErrEmpresaSinSuscripcion
	case "SUCURSAL_NO_VALIDA":
		return errores.ErrSucursalNoActiva
	case "CLIENTE_NO_VALIDO":
		return errores.ErrClienteNoExiste
	case "BARBERO_NO_VALIDO":
		return errores.ErrBarberoNoActivo
	case "SERVICIO_NO_VALIDO":
		return errores.ErrServicioNoActivo
	case "BARBERO_NO_REALIZA_ESTE_SERVICIO":
		return errores.ErrBarberoFueraDeSede
	case "FECHA_DEBE_SER_FUTURA":
		return errores.ErrFechaPasada
	case "PERIODO_NO_ENCONTRADO_PARA_ESA_FECHA":
		return errores.ErrPeriodoNoAbierto
	case "FUERA_DE_HORARIO_DISPONIBLE", "BARBERO_BLOQUEADO_EN_ESA_FECHA":
		return errores.ErrBarberoNoDisponible
	case "HORARIO_OCUPADO":
		return errores.ErrHorarioSolapado
	default:
		return fmt.Errorf("%s", codigo)
	}
}

// RepositorioClienteCockroach

type RepositorioClienteCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioCliente(pool *pgxpool.Pool) *RepositorioClienteCockroach {
	return &RepositorioClienteCockroach{pool: pool}
}

func (r *RepositorioClienteCockroach) ObtenerActivo(ctx context.Context, id string) (clientes.Cliente, error) {
	var c clientes.Cliente
	var correo *string
	err := r.pool.QueryRow(ctx,
		`SELECT id_cliente, id_empresa, nombre, telefono, correo_electronico, estado
		 FROM cliente WHERE id_cliente = $1 AND estado = 'ACTIVO'`,
		id,
	).Scan(&c.ID, &c.EmpresaID, &c.Nombre, &c.Telefono, &correo, &c.Estado)
	if err != nil {
		return clientes.Cliente{}, errores.ErrClienteNoExiste
	}
	if correo != nil {
		c.Correo = *correo
	}
	return c, nil
}

func (r *RepositorioClienteCockroach) ObtenerPorTelefono(ctx context.Context, empresaID, telefono string) (clientes.Cliente, error) {
	var c clientes.Cliente
	var correo *string
	err := r.pool.QueryRow(ctx,
		`SELECT id_cliente, id_empresa, nombre, telefono, correo_electronico, estado
		 FROM cliente WHERE id_empresa = $1 AND telefono = $2 AND estado = 'ACTIVO'`,
		empresaID, telefono,
	).Scan(&c.ID, &c.EmpresaID, &c.Nombre, &c.Telefono, &correo, &c.Estado)
	if err != nil {
		return clientes.Cliente{}, errores.ErrClienteNoExiste
	}
	if correo != nil {
		c.Correo = *correo
	}
	return c, nil
}

func (r *RepositorioReservaCockroach) ListarPorEmpresa(ctx context.Context, empresaID string) ([]reservas.Reserva, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_reserva, id_empresa, id_sucursal, id_cliente, id_barbero, fecha_hora_inicio, estado, origen
		 FROM reserva WHERE id_empresa = $1 ORDER BY fecha_hora_inicio DESC LIMIT 100`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []reservas.Reserva{}
	for rows.Next() {
		var rv reservas.Reserva
		var fechaHora time.Time
		if err := rows.Scan(&rv.ID, &rv.EmpresaID, &rv.SucursalID, &rv.ClienteID, &rv.BarberoID,
			&fechaHora, &rv.Estado, &rv.Origen); err != nil {
			return nil, err
		}
		rv.FechaHoraInicio = fechaHora.UTC().Format(time.RFC3339)
		resultado = append(resultado, rv)
	}
	return resultado, nil
}

func (r *RepositorioClienteCockroach) ListarPorEmpresa(ctx context.Context, empresaID string) ([]clientes.Cliente, error) {
	rows, err := r.pool.Query(ctx,
		// Sin filtro de estado: el admin ve todos (ACTIVO, INACTIVO, BLOQUEADO)
		`SELECT id_cliente, id_empresa, nombre, telefono, correo_electronico, estado
		 FROM cliente WHERE id_empresa = $1 ORDER BY nombre`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []clientes.Cliente{}
	for rows.Next() {
		var c clientes.Cliente
		var correo *string
		if err := rows.Scan(&c.ID, &c.EmpresaID, &c.Nombre, &c.Telefono, &correo, &c.Estado); err != nil {
			return nil, err
		}
		if correo != nil {
			c.Correo = *correo
		}
		resultado = append(resultado, c)
	}
	return resultado, nil
}

// ActualizarCliente actualiza nombre, teléfono y correo de un cliente existente.
func (r *RepositorioClienteCockroach) ActualizarCliente(ctx context.Context, clienteID, nombre, telefono, correo string) error {
	tel := any(telefono)
	if telefono == "" {
		tel = nil
	}
	cor := any(correo)
	if correo == "" {
		cor = nil
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE cliente SET nombre = $1, telefono = $2, correo_electronico = $3 WHERE id_cliente = $4`,
		nombre, tel, cor, clienteID,
	)
	return err
}

// ActualizarEstadoCliente cambia el estado de un cliente (ACTIVO / INACTIVO / BLOQUEADO).
func (r *RepositorioClienteCockroach) ActualizarEstadoCliente(ctx context.Context, clienteID, estado string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE cliente SET estado = $1 WHERE id_cliente = $2`,
		estado, clienteID,
	)
	return err
}

// ActualizarReserva modifica el cliente, barbero, servicio, fecha/hora y origen de una reserva.
// Solo se permite editar reservas en estado PENDIENTE o CONFIRMADA.
func (r *RepositorioReservaCockroach) ActualizarReserva(
	ctx context.Context,
	reservaID, clienteID, barberoID, servicioID, fechaHoraInicio, origen string,
) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE reserva
		 SET id_cliente = $1, id_barbero = $2, id_servicio = $3,
		     fecha_hora_inicio = $4, origen = $5
		 WHERE id_reserva = $6
		   AND estado IN ('PENDIENTE', 'CONFIRMADA')`,
		clienteID, barberoID, servicioID, fechaHoraInicio, origen, reservaID,
	)
	return err
}

func (r *RepositorioClienteCockroach) Guardar(ctx context.Context, c clientes.Cliente) (string, error) {
	correo := any(c.Correo)
	if c.Correo == "" {
		correo = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "cliente_registrar",
		c.EmpresaID, c.Nombre, c.Telefono, correo, nil, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_cliente"), nil
}
