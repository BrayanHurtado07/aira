package errores

import "errors"

// Identidad
var (
	ErrIdentidadNoExiste     = errors.New("identidad_no_existe")
	ErrIdentidadNoActiva     = errors.New("identidad_no_activa")
	ErrIdentidadBloqueada    = errors.New("identidad_bloqueada")
	ErrIdentidadNoVerificada = errors.New("identidad_no_verificada")
	ErrCredencialesInvalidas = errors.New("credenciales_invalidas")
	ErrCorreoYaRegistrado    = errors.New("correo_ya_registrado")
)

// Sesion
var (
	ErrSesionExpirada         = errors.New("sesion_expirada")
	ErrSesionNoExiste         = errors.New("sesion_no_existe")
	ErrSesionNoActiva         = errors.New("sesion_no_activa")
	ErrTokenInvalido          = errors.New("token_invalido")
	ErrCodigoInvalidoOExpirado = errors.New("codigo_invalido_o_expirado")
)

// Gobierno de acceso
var (
	ErrAlcanceDenegado     = errors.New("alcance_denegado")
	ErrAlcanceNoExiste     = errors.New("alcance_no_existe")
	ErrPermisoDenegado     = errors.New("permiso_denegado")
	ErrContextoIncoherente = errors.New("contexto_incoherente")
	ErrRolNoExiste         = errors.New("rol_no_existe")
	ErrAlcanceDuplicado    = errors.New("alcance_duplicado")
)

// Organizacion
var (
	ErrEmpresaNoActiva        = errors.New("empresa_no_activa")
	ErrEmpresaNoExiste        = errors.New("empresa_no_existe")
	ErrEmpresaSinSuscripcion  = errors.New("empresa_sin_suscripcion_activa")
	ErrLimitePlanExcedido     = errors.New("limite_plan_excedido")
	ErrSuscripcionNoExiste    = errors.New("suscripcion_no_existe")
	ErrSuscripcionCancelada   = errors.New("suscripcion_cancelada")
	ErrSucursalNoActiva       = errors.New("sucursal_no_activa")
	ErrSucursalNoExiste       = errors.New("sucursal_no_existe")
	ErrSucursalFueraDeEmpresa = errors.New("sucursal_fuera_de_empresa")
	ErrPeriodoNoAbierto       = errors.New("periodo_no_abierto")
	ErrPeriodoYaCerrado       = errors.New("periodo_ya_cerrado")
	ErrPeriodoYaExiste              = errors.New("periodo_ya_existe")
	ErrConfiguracionNoEncontrada    = errors.New("configuracion_empresa_no_encontrada")
	ErrConfiguracionCampoInvalido   = errors.New("configuracion_campo_invalido")
)

// Agenda
var (
	ErrBarberoNoExiste         = errors.New("barbero_no_existe")
	ErrBarberoNoActivo         = errors.New("barbero_no_activo")
	ErrBarberoFueraDeSede      = errors.New("barbero_fuera_de_sede")
	ErrBarberoNoDisponible     = errors.New("barbero_no_disponible")
	ErrServicioNoExiste        = errors.New("servicio_no_existe")
	ErrServicioNoActivo        = errors.New("servicio_no_activo")
	ErrHorarioInvalido         = errors.New("horario_invalido")
	ErrHorarioSolapado         = errors.New("horario_solapado")
	ErrAsignacionDuplicada     = errors.New("asignacion_duplicada")
	ErrExcepcionYaRegistrada   = errors.New("excepcion_ya_registrada_para_esa_fecha")
	ErrMotivoInvalido          = errors.New("motivo_excepcion_invalido")
)

// Reservas
var (
	ErrReservaNoExiste       = errors.New("reserva_no_existe")
	ErrReservaNoConfirmable  = errors.New("reserva_no_confirmable")
	ErrReservaYaCerrada      = errors.New("reserva_ya_cerrada")
	ErrReservaNoCompletable  = errors.New("reserva_no_completable")
	ErrClienteNoExiste       = errors.New("cliente_no_existe")
	ErrClienteNoOperativo    = errors.New("cliente_no_operativo")
	ErrClienteYaRegistrado   = errors.New("cliente_ya_registrado")
	ErrFechaPasada           = errors.New("fecha_debe_ser_futura")
	ErrSinDisponibilidad     = errors.New("sin_disponibilidad")
	ErrListaEsperaNoExiste     = errors.New("lista_espera_no_existe")
	ErrListaEsperaNoPromovible = errors.New("lista_espera_no_promovible")
)

// Comisiones
var (
	ErrReservaNoCompletada      = errors.New("reserva_no_completada")
	ErrComisionYaGenerada       = errors.New("comision_ya_generada")
	ErrEsquemaComisionNoActivo  = errors.New("esquema_comision_no_activo")
	ErrLiquidacionNoExiste      = errors.New("liquidacion_no_existe")
	ErrLiquidacionNoCalculada   = errors.New("liquidacion_no_calculada")
	ErrLiquidacionNoAprobada    = errors.New("liquidacion_no_aprobada")
)

// Reputación
var (
	ErrResenaNoExiste         = errors.New("resena_no_existe")
	ErrResenaYaExiste         = errors.New("resena_ya_existe")
	ErrPuntajeFueraDeRango    = errors.New("puntaje_fuera_de_rango")
	ErrCalificacionYaRegistrada = errors.New("calificacion_ya_registrada")
	ErrEstadoResenaInvalido   = errors.New("estado_resena_invalido")
)

// Integraciones
var (
	ErrTokenGoogleNoActivo    = errors.New("token_google_calendar_no_activo")
	ErrEventoCalendarYaExiste = errors.New("evento_calendar_ya_existe")
)

// Campañas
var (
	ErrCampanaNoExiste         = errors.New("campana_no_existe")
	ErrCampanaNoEnBorrador     = errors.New("campana_no_en_borrador")
	ErrCampanaSinDestinatarios = errors.New("campana_sin_destinatarios")
	ErrCampanaNoDespachable    = errors.New("campana_no_despachable")
	ErrPlantillaNoValida       = errors.New("plantilla_no_valida")
)

// Lealtad
var (
	ErrProgramaYaExiste     = errors.New("empresa_ya_tiene_programa_activo")
	ErrSellosInvalidos      = errors.New("sellos_debe_ser_positivo")
)

// Canal WhatsApp
var (
	ErrConversacionNoExiste  = errors.New("conversacion_no_existe")
	ErrConversacionNoActiva  = errors.New("conversacion_no_activa")
	ErrAtajoInvalido         = errors.New("atajo_invalido")
	ErrAtajoNoExiste         = errors.New("atajo_no_existe")
)

// Inventario
var (
	ErrTipoProductoInvalido   = errors.New("tipo_producto_invalido")
	ErrPrecioInvalido         = errors.New("precio_invalido")
	ErrCampoRequerido         = errors.New("campo_requerido")
	ErrTipoMovimientoInvalido = errors.New("tipo_movimiento_invalido")
	ErrCantidadInvalida       = errors.New("cantidad_invalida")
	ErrCodigoProductoDuplicado = errors.New("codigo_producto_ya_existe_en_empresa")
	ErrStockInsuficiente      = errors.New("stock_insuficiente")
	ErrProductoNoActivo       = errors.New("producto_no_activo")
)

// Agenda — TarifaEspecial
var (
	ErrTarifaYaExiste = errors.New("tarifa_especial_ya_existe_para_esa_fecha")
)

// Notificaciones
var (
	ErrCanalInvalido = errors.New("canal_invalido")
)

// Infraestructura
var (
	ErrBaseDatosNoDisponible = errors.New("base_de_datos_no_disponible")
	ErrOperacionFallida      = errors.New("operacion_fallida")
)
