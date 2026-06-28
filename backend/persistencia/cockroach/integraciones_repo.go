package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/integraciones"
	"aira/compartido/errores"

	"github.com/jackc/pgx/v5/pgxpool"
)

var _ integraciones.RepositorioIntegracion = (*RepositorioIntegracionCockroach)(nil)

type RepositorioIntegracionCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioIntegracion(pool *pgxpool.Pool) *RepositorioIntegracionCockroach {
	return &RepositorioIntegracionCockroach{pool: pool}
}

func mapearErrorIntegracion(codigo string) error {
	switch codigo {
	case "EMPRESA_NO_ACTIVA":
		return errores.ErrEmpresaNoActiva
	case "TOKEN_GOOGLE_CALENDAR_NO_ACTIVO":
		return errores.ErrTokenGoogleNoActivo
	case "RESERVA_NO_EXISTE_EN_EMPRESA":
		return errores.ErrReservaNoExiste
	case "EVENTO_CALENDAR_YA_EXISTE":
		return errores.ErrEventoCalendarYaExiste
	default:
		return fmt.Errorf("%s", codigo)
	}
}

func (r *RepositorioIntegracionCockroach) GuardarTokenGoogle(
	ctx context.Context, empresaID, accessCifrado, refreshCifrado, expiraEn, correo string,
) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "token_google_calendar_guardar",
		empresaID, accessCifrado, refreshCifrado, expiraEn, correo)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", mapearErrorIntegracion(resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_token"), nil
}

func (r *RepositorioIntegracionCockroach) RevocarTokenGoogle(ctx context.Context, empresaID string) error {
	resultado, err := LlamarProc(ctx, r.pool, "token_google_calendar_revocar", empresaID)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return mapearErrorIntegracion(resultado.Error)
	}
	return nil
}

func (r *RepositorioIntegracionCockroach) ObtenerEstadoGoogle(ctx context.Context, empresaID string) (integraciones.EstadoIntegracion, error) {
	var estado, correo, expira string
	err := r.pool.QueryRow(ctx,
		`SELECT estado, correo_propietario, expira_en::text
		 FROM token_google_calendar WHERE id_empresa = $1`,
		empresaID,
	).Scan(&estado, &correo, &expira)
	if err != nil {
		// Sin fila = no conectado (no es un error de aplicación).
		return integraciones.EstadoIntegracion{Conectado: false}, nil
	}
	return integraciones.EstadoIntegracion{
		Conectado: estado == "ACTIVO",
		Estado:    estado,
		Correo:    correo,
		ExpiraEn:  expira,
	}, nil
}

func (r *RepositorioIntegracionCockroach) RegistrarEventoCalendar(
	ctx context.Context, reservaID, empresaID, googleEventID, creadoPor string,
) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "evento_calendar_registrar",
		reservaID, empresaID, googleEventID, opcional(creadoPor))
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", mapearErrorIntegracion(resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_evento_calendar"), nil
}
