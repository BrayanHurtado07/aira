package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/comisiones"
	"aira/compartido/errores"

	"github.com/jackc/pgx/v5/pgxpool"
)

var _ comisiones.RepositorioComision = (*RepositorioComisionCockroach)(nil)

type RepositorioComisionCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioComision(pool *pgxpool.Pool) *RepositorioComisionCockroach {
	return &RepositorioComisionCockroach{pool: pool}
}

func mapearErrorComision(codigo string) error {
	switch codigo {
	case "EMPRESA_NO_ACTIVA":
		return errores.ErrEmpresaNoActiva
	case "RESERVA_NO_EXISTE":
		return errores.ErrReservaNoExiste
	case "RESERVA_NO_COMPLETADA":
		return errores.ErrReservaNoCompletada
	case "COMISION_YA_GENERADA":
		return errores.ErrComisionYaGenerada
	case "ESQUEMA_COMISION_NO_ACTIVO":
		return errores.ErrEsquemaComisionNoActivo
	case "BARBERO_NO_VALIDO":
		return errores.ErrBarberoNoActivo
	case "FECHA_FIN_ANTERIOR_A_INICIO":
		return errores.ErrHorarioInvalido
	case "LIQUIDACION_NO_EXISTE":
		return errores.ErrLiquidacionNoExiste
	case "LIQUIDACION_NO_CALCULADA":
		return errores.ErrLiquidacionNoCalculada
	case "LIQUIDACION_NO_APROBADA":
		return errores.ErrLiquidacionNoAprobada
	default:
		return fmt.Errorf("%s", codigo)
	}
}

func opcional(valor string) any {
	if valor == "" {
		return nil
	}
	return valor
}

func (r *RepositorioComisionCockroach) CrearEsquema(
	ctx context.Context, empresaID, nombre, tipo string, sueldoBase, porcentaje float64, descripcion, creadoPor string,
) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "esquema_comision_crear",
		empresaID, nombre, tipo, sueldoBase, porcentaje, opcional(descripcion), opcional(creadoPor))
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", mapearErrorComision(resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_esquema"), nil
}

func (r *RepositorioComisionCockroach) GenerarComision(ctx context.Context, reservaID, generadoPor string) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "comision_generar", reservaID, opcional(generadoPor))
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", mapearErrorComision(resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_comision"), nil
}

func (r *RepositorioComisionCockroach) CalcularLiquidacion(
	ctx context.Context, empresaID, barberoID, fechaInicio, fechaFin, frecuencia, calculadoPor string,
) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "liquidacion_calcular",
		empresaID, barberoID, fechaInicio, fechaFin, frecuencia, opcional(calculadoPor))
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", mapearErrorComision(resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_liquidacion"), nil
}

func (r *RepositorioComisionCockroach) AprobarLiquidacion(ctx context.Context, liquidacionID, aprobadoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "liquidacion_aprobar", liquidacionID, opcional(aprobadoPor))
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return mapearErrorComision(resultado.Error)
	}
	return nil
}

func (r *RepositorioComisionCockroach) PagarLiquidacion(ctx context.Context, liquidacionID, pagadoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "liquidacion_pagar", liquidacionID, opcional(pagadoPor))
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return mapearErrorComision(resultado.Error)
	}
	return nil
}

func (r *RepositorioComisionCockroach) ListarComisiones(
	ctx context.Context, empresaID, barberoID, desde, hasta string,
) ([]comisiones.Comision, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT c.id_comision, c.id_barbero, b.nombre, c.id_reserva,
		        c.monto_calculado::text, c.estado, c.generado_en::text
		 FROM comision c
		 JOIN barbero b ON b.id_barbero = c.id_barbero
		 WHERE b.id_empresa = $1
		   AND ($2::uuid IS NULL OR c.id_barbero = $2::uuid)
		   AND ($3::timestamptz IS NULL OR c.generado_en >= $3::timestamptz)
		   AND ($4::timestamptz IS NULL OR c.generado_en <= $4::timestamptz)
		 ORDER BY c.generado_en DESC`,
		empresaID, opcional(barberoID), opcional(desde), opcional(hasta),
	)
	if err != nil {
		return nil, err
	}
	defer filas.Close()

	lista := []comisiones.Comision{}
	for filas.Next() {
		var c comisiones.Comision
		if err := filas.Scan(&c.ID, &c.BarberoID, &c.BarberoNombre, &c.ReservaID,
			&c.MontoCalculado, &c.Estado, &c.GeneradoEn); err != nil {
			return nil, err
		}
		lista = append(lista, c)
	}
	return lista, filas.Err()
}

func (r *RepositorioComisionCockroach) ListarLiquidaciones(ctx context.Context, empresaID string) ([]comisiones.Liquidacion, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT l.id_liquidacion, l.id_barbero, b.nombre, l.fecha_inicio::text,
		        l.fecha_fin::text, l.monto_total::text, l.frecuencia, l.estado
		 FROM liquidacion l
		 JOIN barbero b ON b.id_barbero = l.id_barbero
		 WHERE l.id_empresa = $1
		 ORDER BY l.fecha_inicio DESC`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer filas.Close()

	lista := []comisiones.Liquidacion{}
	for filas.Next() {
		var l comisiones.Liquidacion
		if err := filas.Scan(&l.ID, &l.BarberoID, &l.BarberoNombre, &l.FechaInicio,
			&l.FechaFin, &l.MontoTotal, &l.Frecuencia, &l.Estado); err != nil {
			return nil, err
		}
		lista = append(lista, l)
	}
	return lista, filas.Err()
}
