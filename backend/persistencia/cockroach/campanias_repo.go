package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/campanias"
	"aira/compartido/errores"

	"github.com/jackc/pgx/v5/pgxpool"
)

var _ campanias.RepositorioCampana = (*RepositorioCampanaCockroach)(nil)

type RepositorioCampanaCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioCampana(pool *pgxpool.Pool) *RepositorioCampanaCockroach {
	return &RepositorioCampanaCockroach{pool: pool}
}

func mapearErrorCampana(codigo string) error {
	switch codigo {
	case "EMPRESA_NO_ACTIVA":
		return errores.ErrEmpresaNoActiva
	case "PLANTILLA_NO_VALIDA":
		return errores.ErrPlantillaNoValida
	case "FECHA_PROGRAMADA_EN_EL_PASADO":
		return errores.ErrFechaPasada
	case "CAMPANA_NO_EXISTE":
		return errores.ErrCampanaNoExiste
	case "CAMPANA_NO_EN_BORRADOR":
		return errores.ErrCampanaNoEnBorrador
	case "CAMPANA_SIN_DESTINATARIOS":
		return errores.ErrCampanaSinDestinatarios
	case "CAMPANA_NO_DESPACHABLE":
		return errores.ErrCampanaNoDespachable
	default:
		return fmt.Errorf("%s", codigo)
	}
}

func (r *RepositorioCampanaCockroach) CrearCampana(
	ctx context.Context, empresaID, plantillaID, nombre, tipo, programadaPara, creadoPor string,
) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "campana_crear",
		empresaID, plantillaID, nombre, tipo, opcional(programadaPara), opcional(creadoPor))
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", mapearErrorCampana(resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_campana"), nil
}

func (r *RepositorioCampanaCockroach) CargarInactivos(ctx context.Context, campanaID string, dias int, agregadoPor string) (int, error) {
	resultado, err := LlamarProc(ctx, r.pool, "campana_cargar_inactivos", campanaID, dias, opcional(agregadoPor))
	if err != nil {
		return 0, err
	}
	if !resultado.Exito {
		return 0, mapearErrorCampana(resultado.Error)
	}
	var n int
	_ = r.pool.QueryRow(ctx,
		`SELECT count(*) FROM destinatario_campana WHERE id_campana = $1`, campanaID).Scan(&n)
	return n, nil
}

func (r *RepositorioCampanaCockroach) Despachar(ctx context.Context, campanaID, despachadoPor string) (int, error) {
	resultado, err := LlamarProc(ctx, r.pool, "campana_despachar", campanaID, opcional(despachadoPor))
	if err != nil {
		return 0, err
	}
	if !resultado.Exito {
		return 0, mapearErrorCampana(resultado.Error)
	}
	var n int
	_ = r.pool.QueryRow(ctx,
		`SELECT count(*) FROM log_envio_campana WHERE id_campana = $1 AND resultado = 'ENVIADO'`, campanaID).Scan(&n)
	return n, nil
}

func (r *RepositorioCampanaCockroach) ListarCampanas(ctx context.Context, empresaID string) ([]campanias.Campana, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT c.id_campana, c.nombre, c.tipo, c.estado,
		        COALESCE(c.programada_para::text, ''), c.creado_en::text,
		        (SELECT count(*) FROM destinatario_campana d WHERE d.id_campana = c.id_campana),
		        (SELECT count(*) FROM log_envio_campana l WHERE l.id_campana = c.id_campana AND l.resultado = 'ENVIADO')
		 FROM campana c
		 WHERE c.id_empresa = $1
		 ORDER BY c.creado_en DESC`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer filas.Close()

	lista := []campanias.Campana{}
	for filas.Next() {
		var c campanias.Campana
		if err := filas.Scan(&c.ID, &c.Nombre, &c.Tipo, &c.Estado,
			&c.ProgramadaPara, &c.CreadoEn, &c.Destinatarios, &c.Enviados); err != nil {
			return nil, err
		}
		lista = append(lista, c)
	}
	return lista, filas.Err()
}
