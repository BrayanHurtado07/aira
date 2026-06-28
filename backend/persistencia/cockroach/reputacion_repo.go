package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/reputacion"
	"aira/compartido/errores"

	"github.com/jackc/pgx/v5/pgxpool"
)

var _ reputacion.RepositorioReputacion = (*RepositorioReputacionCockroach)(nil)

type RepositorioReputacionCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioReputacion(pool *pgxpool.Pool) *RepositorioReputacionCockroach {
	return &RepositorioReputacionCockroach{pool: pool}
}

func mapearErrorReputacion(codigo string) error {
	switch codigo {
	case "RESERVA_NO_EXISTE":
		return errores.ErrReservaNoExiste
	case "RESERVA_NO_COMPLETADA":
		return errores.ErrReservaNoCompletada
	case "RESENA_YA_EXISTE":
		return errores.ErrResenaYaExiste
	case "RESENA_NO_EXISTE":
		return errores.ErrResenaNoExiste
	case "PUNTAJE_FUERA_DE_RANGO":
		return errores.ErrPuntajeFueraDeRango
	case "BARBERO_NO_ACTIVO":
		return errores.ErrBarberoNoActivo
	case "SUCURSAL_NO_ACTIVA":
		return errores.ErrSucursalNoActiva
	case "CALIFICACION_YA_REGISTRADA":
		return errores.ErrCalificacionYaRegistrada
	case "ESTADO_RESENA_INVALIDO":
		return errores.ErrEstadoResenaInvalido
	default:
		return fmt.Errorf("%s", codigo)
	}
}

func (r *RepositorioReputacionCockroach) RegistrarResena(
	ctx context.Context, reservaID string, puntajeBarbero, puntajeSucursal int, comentario, creadoPor string,
) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "resena_registrar_completa",
		reservaID, puntajeBarbero, puntajeSucursal, opcional(comentario), opcional(creadoPor))
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", mapearErrorReputacion(resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_resena"), nil
}

func (r *RepositorioReputacionCockroach) ActualizarEstado(ctx context.Context, resenaID, nuevoEstado, actualizadoPor string) error {
	resultado, err := LlamarProc(ctx, r.pool, "resena_actualizar_estado", resenaID, nuevoEstado, opcional(actualizadoPor))
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return mapearErrorReputacion(resultado.Error)
	}
	return nil
}

func (r *RepositorioReputacionCockroach) ListarResenas(ctx context.Context, empresaID, estado string) ([]reputacion.Resena, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT r.id_resena, r.id_reserva, r.estado, r.creado_en::text,
		        COALESCE(b.nombre, ''), COALESCE(cb.puntaje, 0), COALESCE(cb.comentario, '')
		 FROM resena r
		 LEFT JOIN calificacion_barbero cb ON cb.id_resena = r.id_resena
		 LEFT JOIN barbero b ON b.id_barbero = cb.id_barbero
		 WHERE r.id_empresa = $1
		   AND ($2 = '' OR r.estado = $2)
		 ORDER BY r.creado_en DESC`,
		empresaID, estado,
	)
	if err != nil {
		return nil, err
	}
	defer filas.Close()

	lista := []reputacion.Resena{}
	for filas.Next() {
		var s reputacion.Resena
		if err := filas.Scan(&s.ID, &s.ReservaID, &s.Estado, &s.CreadoEn,
			&s.BarberoNombre, &s.PuntajeBarbero, &s.Comentario); err != nil {
			return nil, err
		}
		lista = append(lista, s)
	}
	return lista, filas.Err()
}

func (r *RepositorioReputacionCockroach) PromedioBarbero(ctx context.Context, barberoID string) (reputacion.ReputacionBarbero, error) {
	rep := reputacion.ReputacionBarbero{BarberoID: barberoID}
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(ROUND(AVG(cb.puntaje), 2), 0)::text, count(*)
		 FROM calificacion_barbero cb
		 JOIN resena r ON r.id_resena = cb.id_resena
		 WHERE cb.id_barbero = $1 AND r.estado = 'PUBLICADA'`,
		barberoID,
	).Scan(&rep.Promedio, &rep.Total)
	if err != nil {
		return reputacion.ReputacionBarbero{}, err
	}
	return rep, nil
}
