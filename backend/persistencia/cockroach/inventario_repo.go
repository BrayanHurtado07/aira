package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/inventario/movimientos"
	"aira/capacidades/inventario/productos"
	casoReservas "aira/capacidades/reservas/casos_uso"
	listaEspera "aira/capacidades/reservas/lista_espera"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ── RepositorioProductoCockroach ─────────────────────────────────────────────

var _ productos.RepositorioProducto = (*RepositorioProductoCockroach)(nil)

type RepositorioProductoCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioProducto(pool *pgxpool.Pool) *RepositorioProductoCockroach {
	return &RepositorioProductoCockroach{pool: pool}
}

func (r *RepositorioProductoCockroach) Crear(ctx context.Context, p productos.Producto) (string, error) {
	desc := any(p.Descripcion)
	if p.Descripcion == "" {
		desc = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "producto_crear",
		p.EmpresaID, p.Nombre, p.Codigo, p.Tipo, p.PrecioUnitario, desc, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		if resultado.Error == "CODIGO_PRODUCTO_YA_EXISTE_EN_EMPRESA" {
			return "", errores.ErrCodigoProductoDuplicado
		}
		if resultado.Error == "EMPRESA_NO_ACTIVA" {
			return "", errores.ErrEmpresaNoActiva
		}
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_producto"), nil
}

func (r *RepositorioProductoCockroach) ObtenerActivo(ctx context.Context, id string) (productos.Producto, error) {
	var p productos.Producto
	var desc *string
	err := r.pool.QueryRow(ctx,
		`SELECT id_producto, id_empresa, nombre, codigo, tipo, precio_unitario,
		        COALESCE(descripcion,''), estado
		 FROM producto WHERE id_producto = $1 AND estado = 'ACTIVO'`,
		id,
	).Scan(&p.ID, &p.EmpresaID, &p.Nombre, &p.Codigo, &p.Tipo, &p.PrecioUnitario, &desc, &p.Estado)
	if err != nil {
		return productos.Producto{}, errores.ErrProductoNoActivo
	}
	if desc != nil {
		p.Descripcion = *desc
	}
	return p, nil
}

func (r *RepositorioProductoCockroach) ListarPorEmpresa(ctx context.Context, empresaID string) ([]productos.Producto, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_producto, id_empresa, nombre, codigo, tipo, precio_unitario,
		        COALESCE(descripcion,''), estado
		 FROM producto WHERE id_empresa = $1 AND estado != 'ELIMINADO' ORDER BY nombre`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []productos.Producto{}
	for rows.Next() {
		var p productos.Producto
		var desc *string
		if err := rows.Scan(&p.ID, &p.EmpresaID, &p.Nombre, &p.Codigo, &p.Tipo, &p.PrecioUnitario, &desc, &p.Estado); err != nil {
			return nil, err
		}
		if desc != nil {
			p.Descripcion = *desc
		}
		resultado = append(resultado, p)
	}
	return resultado, nil
}

// ── RepositorioMovimientoInventarioCockroach ─────────────────────────────────

var _ movimientos.RepositorioMovimientoInventario = (*RepositorioMovimientoInventarioCockroach)(nil)

type RepositorioMovimientoInventarioCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioMovimientoInventario(pool *pgxpool.Pool) *RepositorioMovimientoInventarioCockroach {
	return &RepositorioMovimientoInventarioCockroach{pool: pool}
}

func (r *RepositorioMovimientoInventarioCockroach) Registrar(
	ctx context.Context,
	m movimientos.MovimientoInventario,
) (string, error) {
	causa := any(m.CausaDescripcion)
	if m.CausaDescripcion == "" {
		causa = nil
	}
	reservaID := any(m.ReservaID)
	if m.ReservaID == "" {
		reservaID = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "movimiento_inventario_registrar",
		m.ProductoID, m.SucursalID, m.TipoMovimiento, m.Cantidad, causa, reservaID, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		if resultado.Error == "STOCK_INSUFICIENTE" {
			return "", errores.ErrStockInsuficiente
		}
		if resultado.Error == "PRODUCTO_NO_ACTIVO" {
			return "", errores.ErrProductoNoActivo
		}
		if resultado.Error == "SUCURSAL_NO_ACTIVA" {
			return "", errores.ErrSucursalNoActiva
		}
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_movimiento"), nil
}

func (r *RepositorioMovimientoInventarioCockroach) ListarStockPorSucursal(
	ctx context.Context,
	sucursalID string,
) ([]movimientos.StockSucursal, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT ss.id_producto, ss.id_sucursal, ss.cantidad_actual, ss.cantidad_minima
		 FROM stock_sucursal ss
		 WHERE ss.id_sucursal = $1
		 ORDER BY ss.id_producto`,
		sucursalID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []movimientos.StockSucursal{}
	for rows.Next() {
		var s movimientos.StockSucursal
		if err := rows.Scan(&s.ProductoID, &s.SucursalID, &s.CantidadActual, &s.CantidadMinima); err != nil {
			return nil, err
		}
		resultado = append(resultado, s)
	}
	return resultado, nil
}

// ── RepositorioListaEsperaCockroach ──────────────────────────────────────────

var _ listaEspera.RepositorioListaEspera = (*RepositorioListaEsperaCockroach)(nil)

type RepositorioListaEsperaCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioListaEspera(pool *pgxpool.Pool) *RepositorioListaEsperaCockroach {
	return &RepositorioListaEsperaCockroach{pool: pool}
}

func (r *RepositorioListaEsperaCockroach) Ingresar(
	ctx context.Context,
	e listaEspera.EntradaListaEspera,
) (string, error) {
	barberoID := any(e.BarberoID)
	if e.BarberoID == "" {
		barberoID = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "lista_espera_ingresar",
		e.EmpresaID, e.ClienteID, e.SucursalID, e.ServicioID, e.FechaHoraDeseada, barberoID)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "EMPRESA_NO_ACTIVA":
			return "", errores.ErrEmpresaNoActiva
		case "CLIENTE_NO_VALIDO":
			return "", errores.ErrClienteNoExiste
		case "SUCURSAL_NO_VALIDA":
			return "", errores.ErrSucursalNoActiva
		case "SERVICIO_NO_VALIDO":
			return "", errores.ErrServicioNoActivo
		case "BARBERO_NO_VALIDO":
			return "", errores.ErrBarberoNoActivo
		case "FECHA_DEBE_SER_FUTURA":
			return "", errores.ErrFechaPasada
		}
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_lista_espera"), nil
}

func (r *RepositorioListaEsperaCockroach) ListarPorEmpresa(
	ctx context.Context,
	empresaID string,
) ([]listaEspera.EntradaListaEspera, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT le.id_lista_espera, le.id_empresa, le.id_cliente, le.id_sucursal,
		        le.id_servicio, COALESCE(le.id_barbero::text, ''),
		        le.fecha_hora_deseada::text, le.estado
		 FROM lista_espera le
		 WHERE le.id_empresa = $1
		   AND le.estado = 'ESPERANDO'
		 ORDER BY le.fecha_hora_deseada`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []listaEspera.EntradaListaEspera{}
	for rows.Next() {
		var e listaEspera.EntradaListaEspera
		if err := rows.Scan(&e.ID, &e.EmpresaID, &e.ClienteID, &e.SucursalID,
			&e.ServicioID, &e.BarberoID, &e.FechaHoraDeseada, &e.Estado); err != nil {
			return nil, err
		}
		resultado = append(resultado, e)
	}
	return resultado, nil
}

func (r *RepositorioListaEsperaCockroach) Promover(ctx context.Context, listaEsperaID, marcadoPor string) error {
	mp := any(marcadoPor)
	if marcadoPor == "" {
		mp = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "lista_espera_promover", listaEsperaID, mp)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "LISTA_ESPERA_NO_EXISTE":
			return errores.ErrListaEsperaNoExiste
		case "LISTA_ESPERA_NO_PROMOVIBLE":
			return errores.ErrListaEsperaNoPromovible
		default:
			return fmt.Errorf("%s", resultado.Error)
		}
	}
	return nil
}

// ── RepositorioComplementoReservaCockroach ────────────────────────────────────

var _ casoReservas.RepositorioComplementoReserva = (*RepositorioComplementoReservaCockroach)(nil)

type RepositorioComplementoReservaCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioComplementoReserva(pool *pgxpool.Pool) *RepositorioComplementoReservaCockroach {
	return &RepositorioComplementoReservaCockroach{pool: pool}
}

func (r *RepositorioComplementoReservaCockroach) Agregar(
	ctx context.Context,
	reservaID, productoID string,
	cantidad float64,
	registradoPor string,
) error {
	rp := any(registradoPor)
	if registradoPor == "" {
		rp = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "complemento_reserva_agregar",
		reservaID, productoID, cantidad, rp)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "RESERVA_NO_EXISTE":
			return errores.ErrReservaNoExiste
		case "RESERVA_NO_ACTIVA":
			return errores.ErrReservaYaCerrada
		case "PRODUCTO_NO_ACTIVO":
			return errores.ErrProductoNoActivo
		case "PRODUCTO_FUERA_DE_EMPRESA":
			return errores.ErrEmpresaNoActiva
		}
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

func (r *RepositorioComplementoReservaCockroach) ListarPorReserva(
	ctx context.Context,
	reservaID string,
) ([]casoReservas.ComplementoReservaItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT cr.id_producto, COALESCE(p.nombre,''), cr.cantidad
		 FROM complemento_reserva cr
		 LEFT JOIN producto p ON p.id_producto = cr.id_producto
		 WHERE cr.id_reserva = $1`,
		reservaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []casoReservas.ComplementoReservaItem{}
	for rows.Next() {
		var item casoReservas.ComplementoReservaItem
		if err := rows.Scan(&item.ProductoID, &item.NombreProducto, &item.Cantidad); err != nil {
			return nil, err
		}
		resultado = append(resultado, item)
	}
	return resultado, nil
}
