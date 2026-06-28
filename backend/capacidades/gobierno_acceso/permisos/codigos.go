package permisos

const (
	// Identidad
	UsuarioInactivar = "USUARIO_INACTIVAR"

	// Organización
	SedeCrear              = "SEDE_CREAR"
	PeriodoCrear           = "PERIODO_CREAR"
	PeriodoCerrar          = "PERIODO_CERRAR"
	ConfiguracionGestionar = "CONFIGURACION_GESTIONAR"

	// Gobierno de Acceso
	AlcanceAsignar = "ALCANCE_ASIGNAR"
	AlcanceRevocar = "ALCANCE_REVOCAR"

	// Agenda — barberos
	BarberoRegistrar      = "BARBERO_CREAR"
	BarberoActualizar     = "BARBERO_ACTUALIZAR"
	BarberoServicioAsignar = "BARBERO_SERVICIO_ASIGNAR"

	// Agenda — servicios
	ServicioRegistrar = "SERVICIO_CREAR"
	ServicioActualizar = "SERVICIO_ACTUALIZAR"

	// Agenda — disponibilidad
	DisponibilidadCrear             = "DISPONIBILIDAD_CREAR"
	ExcepcionDisponibilidadRegistrar = "EXCEPCION_DISPONIBILIDAD_REGISTRAR"

	// Reservas
	ReservaActualizar = "RESERVA_ACTUALIZAR"
	ReservaConfirmar  = "RESERVA_CONFIRMAR"
	ReservaCancelar   = "RESERVA_CANCELAR"
	ReservaCompletar  = "RESERVA_COMPLETAR"

	// Clientes
	ClienteActualizar = "CLIENTE_ACTUALIZAR"

	// Monetización
	SuscripcionGestionar = "SUSCRIPCION_GESTIONAR"

	// Comisiones
	ComisionGestionar = "COMISION_GESTIONAR"

	// Reputación
	ReputacionGestionar = "REPUTACION_GESTIONAR"

	// Lealtad
	SelloGestionar         = "SELLO_GESTIONAR"
	ProgramaLealtadGestionar = "PROGRAMA_LEALTAD_GESTIONAR"

	// Notificaciones
	RecordatorioGestionar = "RECORDATORIO_GESTIONAR"

	// Inventario
	InventarioGestionar = "INVENTARIO_GESTIONAR"

	// Agenda — TarifaEspecial
	TarifaEspecialCrear = "TARIFA_ESPECIAL_CREAR"

	// Notificaciones
	PlantillaGestionar = "PLANTILLA_GESTIONAR"
)
