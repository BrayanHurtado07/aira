package http

import (
	"encoding/json"
	"net/http"

	"aira/compartido/errores"
)

type Respuesta struct {
	Exito bool   `json:"exito"`
	Datos any    `json:"datos,omitempty"`
	Error string `json:"error,omitempty"`
}

func ResponderOK(w http.ResponseWriter, datos any) {
	responder(w, http.StatusOK, Respuesta{Exito: true, Datos: datos})
}

func ResponderCreado(w http.ResponseWriter, datos any) {
	responder(w, http.StatusCreated, Respuesta{Exito: true, Datos: datos})
}

func ResponderError(w http.ResponseWriter, codigo int, mensaje string) {
	responder(w, codigo, Respuesta{Exito: false, Error: mensaje})
}

func ResponderErrorDominio(w http.ResponseWriter, err error) {
	codigo, mensaje := traducirError(err)
	ResponderError(w, codigo, mensaje)
}

func responder(w http.ResponseWriter, status int, cuerpo any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(cuerpo)
}

func traducirError(err error) (int, string) {
	switch err {
	// Identidad — 401
	case errores.ErrIdentidadNoExiste,
		errores.ErrIdentidadNoActiva,
		errores.ErrIdentidadBloqueada,
		errores.ErrIdentidadNoVerificada,
		errores.ErrCredencialesInvalidas:
		return http.StatusUnauthorized, err.Error()

	// Sesión — 401
	case errores.ErrSesionExpirada,
		errores.ErrSesionNoExiste,
		errores.ErrSesionNoActiva,
		errores.ErrTokenInvalido,
		errores.ErrCodigoInvalidoOExpirado:
		return http.StatusUnauthorized, err.Error()

	// Gobierno de acceso — 403
	case errores.ErrPermisoDenegado,
		errores.ErrAlcanceDenegado,
		errores.ErrContextoIncoherente,
		errores.ErrSucursalFueraDeEmpresa:
		return http.StatusForbidden, err.Error()

	// Recursos no encontrados — 404
	case errores.ErrReservaNoExiste,
		errores.ErrClienteNoExiste,
		errores.ErrBarberoNoExiste,
		errores.ErrServicioNoExiste,
		errores.ErrEmpresaNoExiste,
		errores.ErrSucursalNoExiste,
		errores.ErrAlcanceNoExiste,
		errores.ErrRolNoExiste,
		errores.ErrConversacionNoExiste,
		errores.ErrConfiguracionNoEncontrada,
		errores.ErrListaEsperaNoExiste,
		errores.ErrLiquidacionNoExiste,
		errores.ErrResenaNoExiste:
		return http.StatusNotFound, err.Error()

	// Monetización — 402 Pago requerido (empresa sin suscripción activa)
	case errores.ErrEmpresaSinSuscripcion:
		return http.StatusPaymentRequired, err.Error()

	// Conflictos de negocio — 409
	case errores.ErrLimitePlanExcedido,
		errores.ErrListaEsperaNoPromovible,
		errores.ErrReservaNoCompletada,
		errores.ErrComisionYaGenerada,
		errores.ErrEsquemaComisionNoActivo,
		errores.ErrLiquidacionNoCalculada,
		errores.ErrLiquidacionNoAprobada,
		errores.ErrResenaYaExiste,
		errores.ErrPuntajeFueraDeRango,
		errores.ErrCalificacionYaRegistrada,
		errores.ErrEstadoResenaInvalido,
		errores.ErrTokenGoogleNoActivo,
		errores.ErrEventoCalendarYaExiste,
		errores.ErrReservaNoConfirmable,
		errores.ErrReservaYaCerrada,
		errores.ErrReservaNoCompletable,
		errores.ErrCorreoYaRegistrado,
		errores.ErrClienteYaRegistrado,
		errores.ErrAlcanceDuplicado,
		errores.ErrAsignacionDuplicada,
		errores.ErrHorarioSolapado,
		errores.ErrHorarioInvalido,
		errores.ErrFechaPasada,
		errores.ErrSinDisponibilidad,
		errores.ErrSucursalNoActiva,
		errores.ErrEmpresaNoActiva,
		errores.ErrBarberoNoActivo,
		errores.ErrBarberoFueraDeSede,
		errores.ErrBarberoNoDisponible,
		errores.ErrServicioNoActivo,
		errores.ErrConversacionNoActiva,
		errores.ErrPeriodoNoAbierto,
		errores.ErrPeriodoYaCerrado,
		errores.ErrPeriodoYaExiste,
		errores.ErrClienteNoOperativo,
		errores.ErrProgramaYaExiste,
		errores.ErrSellosInvalidos,
		errores.ErrConfiguracionCampoInvalido,
		errores.ErrExcepcionYaRegistrada,
		errores.ErrMotivoInvalido,
		errores.ErrTipoProductoInvalido,
		errores.ErrPrecioInvalido,
		errores.ErrCampoRequerido,
		errores.ErrTipoMovimientoInvalido,
		errores.ErrCantidadInvalida,
		errores.ErrCodigoProductoDuplicado,
		errores.ErrStockInsuficiente,
		errores.ErrProductoNoActivo,
		errores.ErrTarifaYaExiste,
		errores.ErrCanalInvalido:
		return http.StatusConflict, err.Error()

	default:
		return http.StatusInternalServerError, "error_interno"
	}
}
