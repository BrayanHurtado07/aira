package http

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"aira/aplicacion/orquestacion"
	casoAgenda "aira/capacidades/agenda/casos_uso"
	casoCampanias "aira/capacidades/campanias/casos_uso"
	casoCanal "aira/capacidades/canal_whatsapp/casos_uso"
	casoComisiones "aira/capacidades/comisiones/casos_uso"
	casoGobierno "aira/capacidades/gobierno_acceso/casos_uso"
	"aira/capacidades/gobierno_acceso/permisos"
	casoIdentidad "aira/capacidades/identidad/casos_uso"
	casoIntegraciones "aira/capacidades/integraciones/casos_uso"
	casoInventario "aira/capacidades/inventario/casos_uso"
	casoLealtad "aira/capacidades/lealtad/casos_uso"
	casoMonetizacion "aira/capacidades/monetizacion/casos_uso"
	casoNotificaciones "aira/capacidades/notificaciones/casos_uso"
	casoOrg "aira/capacidades/organizacion/casos_uso"
	"aira/capacidades/organizacion/periodos"
	"aira/capacidades/organizacion/sedes"
	casoReputacion "aira/capacidades/reputacion/casos_uso"
	casoReservas "aira/capacidades/reservas/casos_uso"
	casoTablero "aira/capacidades/tablero/casos_uso"
	repoCockroach "aira/persistencia/cockroach"
	"aira/plataforma/identidad"

	"github.com/go-chi/chi/v5"
)

type Rutas struct {
	// Identidad
	registrarUsuario                  *casoIdentidad.CasoUsoRegistrarUsuario
	iniciarSesion                     *casoIdentidad.CasoUsoIniciarSesionGlobal
	cerrarSesion                      *casoIdentidad.CasoUsoCerrarSesion
	inactivarUsuario                  *casoIdentidad.CasoUsoInactivarUsuario
	cambiarPassword                   *casoIdentidad.CasoUsoCambiarPassword
	solicitarVerificacionCorreo       *casoIdentidad.CasoUsoSolicitarVerificacionCorreo
	verificarCorreo                   *casoIdentidad.CasoUsoVerificarCorreo
	solicitarRestablecimientoPassword *casoIdentidad.CasoUsoSolicitarRestablecimientoPassword
	restablecerPassword               *casoIdentidad.CasoUsoRestablecerPassword

	// Organización
	crearEmpresa             *casoOrg.CasoUsoCrearEmpresa
	crearSucursal            *casoOrg.CasoUsoCrearSucursal
	actualizarEstadoSucursal *casoOrg.CasoUsoActualizarEstadoSucursal
	crearPeriodo             *casoOrg.CasoUsoCrearPeriodo
	cerrarPeriodo            *casoOrg.CasoUsoCerrarPeriodo
	guardarConfiguracion     *casoOrg.CasoUsoGuardarConfiguracionEmpresa

	// Gobierno de Acceso
	asignarAlcance *casoGobierno.CasoUsoAsignarAlcance
	revocarAlcance *casoGobierno.CasoUsoRevocarAlcance

	// Agenda
	registrarBarbero                 *casoAgenda.CasoUsoRegistrarBarbero
	actualizarBarbero                *casoAgenda.CasoUsoActualizarBarbero
	actualizarEstadoBarbero          *casoAgenda.CasoUsoActualizarEstadoBarbero
	desasignarServicio               *casoAgenda.CasoUsoDesasignarServicioBarbero
	crearServicio                    *casoAgenda.CasoUsoCrearServicio
	actualizarServicio               *casoAgenda.CasoUsoActualizarServicio
	actualizarEstadoServicio         *casoAgenda.CasoUsoActualizarEstadoServicio
	registrarDisponibilidad          *casoAgenda.CasoUsoRegistrarDisponibilidad
	asignarServicioBarbero           *casoAgenda.CasoUsoAsignarServicioBarbero
	registrarExcepcionDisponibilidad *casoAgenda.CasoUsoRegistrarExcepcionDisponibilidad

	// Reservas
	registrarCliente        *casoReservas.CasoUsoRegistrarCliente
	actualizarCliente       *casoReservas.CasoUsoActualizarCliente
	actualizarEstadoCliente *casoReservas.CasoUsoActualizarEstadoCliente
	registrarReserva        *casoReservas.CasoUsoRegistrarReserva
	actualizarReserva       *casoReservas.CasoUsoActualizarReserva
	confirmarReserva        *casoReservas.CasoUsoConfirmarReserva
	cancelarReserva         *casoReservas.CasoUsoCancelarReserva
	completarReserva        *casoReservas.CasoUsoCompletarReserva
	marcarNoAsistio         *casoReservas.CasoUsoMarcarNoAsistio

	// Canal WhatsApp
	iniciarConversacion *casoCanal.CasoUsoIniciarConversacion
	registrarMensaje    *casoCanal.CasoUsoRegistrarMensaje
	gestionarSesionChat *casoCanal.CasoUsoGestionarSesionChat
	atenderChat         *casoCanal.CasoUsoAtenderChat

	// Monetización
	activarSuscripcion   *casoMonetizacion.CasoUsoActivarSuscripcion
	suspenderSuscripcion *casoMonetizacion.CasoUsoSuspenderSuscripcion
	cancelarSuscripcion  *casoMonetizacion.CasoUsoCancelarSuscripcion
	cobrarSuscripcion    *casoMonetizacion.CasoUsoCobrarSuscripcion

	// Lealtad
	crearProgramaLealtad *casoLealtad.CasoUsoCrearProgramaLealtad
	acumularSello        *casoLealtad.CasoUsoAcumularSello
	anularSello          *casoLealtad.CasoUsoAnularSello
	aplicarCanje         *casoLealtad.CasoUsoAplicarCanje

	// Notificaciones
	programarRecordatorio *casoNotificaciones.CasoUsoProgramarRecordatorio
	cancelarRecordatorio  *casoNotificaciones.CasoUsoCancelarRecordatorio
	crearPlantilla        *casoNotificaciones.CasoUsoCrearPlantilla

	// Inventario
	crearProducto                 *casoInventario.CasoUsoCrearProducto
	registrarMovimientoInventario *casoInventario.CasoUsoRegistrarMovimientoInventario

	// Reservas — complementos y lista de espera
	agregarComplementoReserva *casoReservas.CasoUsoAgregarComplementoReserva
	ingresarListaEspera       *casoReservas.CasoUsoIngresarListaEspera
	promoverListaEspera       *casoReservas.CasoUsoPromoverListaEspera

	// Agenda — tarifas
	crearTarifaEspecial *casoAgenda.CasoUsoCrearTarifaEspecial

	// Tablero
	obtenerMetricasTablero *casoTablero.CasoUsoObtenerMetricasTablero

	// Comisiones
	crearEsquemaComision *casoComisiones.CasoUsoCrearEsquemaComision
	generarComision      *casoComisiones.CasoUsoGenerarComision
	calcularLiquidacion  *casoComisiones.CasoUsoCalcularLiquidacion
	aprobarLiquidacion   *casoComisiones.CasoUsoAprobarLiquidacion
	pagarLiquidacion     *casoComisiones.CasoUsoPagarLiquidacion
	repoComision         *repoCockroach.RepositorioComisionCockroach

	// Reputación
	registrarResena        *casoReputacion.CasoUsoRegistrarResena
	actualizarEstadoResena *casoReputacion.CasoUsoActualizarEstadoResena
	repoReputacion         *repoCockroach.RepositorioReputacionCockroach

	// Integraciones (Google Calendar)
	conectarGoogle     *casoIntegraciones.CasoUsoConectarGoogleCalendar
	desconectarGoogle  *casoIntegraciones.CasoUsoDesconectarGoogleCalendar
	sincronizarReserva *casoIntegraciones.CasoUsoSincronizarReserva
	repoIntegracion    *repoCockroach.RepositorioIntegracionCockroach

	// Campañas
	crearCampana     *casoCampanias.CasoUsoCrearCampana
	cargarInactivos  *casoCampanias.CasoUsoCargarInactivos
	despacharCampana *casoCampanias.CasoUsoDespacharCampana
	repoCampana      *repoCockroach.RepositorioCampanaCockroach

	// Aira IA (cerebro conversacional)
	conversarAira      *casoCanal.CasoUsoConversarAira
	recibirWebhookWA   *casoCanal.CasoUsoRecibirWebhookWhatsApp
	repoConversacionWA *repoCockroach.RepositorioConversacionCockroach
	repoSesionChatWA   *repoCockroach.RepositorioSesionChatCockroach

	// Identidad — refresh
	refrescarSesion *casoIdentidad.CasoUsoRefrescarSesion

	// Plataforma SUPERADMIN
	onboardearEmpresa        *casoOrg.CasoUsoOnboardearEmpresa
	listarEmpresasPlataforma *casoOrg.CasoUsoListarEmpresasPlataforma

	// Repositorios de listado
	repoEmpresa                 *repoCockroach.RepositorioEmpresaCockroach
	repoBarberos                *repoCockroach.RepositorioBarberosCockroach
	repoServicios               *repoCockroach.RepositorioServicioCockroach
	repoReservas                *repoCockroach.RepositorioReservaCockroach
	repoClientes                *repoCockroach.RepositorioClienteCockroach
	repoSucursales              *repoCockroach.RepositorioSucursalCockroach
	repoPeriodo                 *repoCockroach.RepositorioPeriodoCockroach
	repoDisponibilidad          *repoCockroach.RepositorioDisponibilidadCockroach
	repoExcepcionDisponibilidad *repoCockroach.RepositorioExcepcionDisponibilidadCockroach
	repoTarifas                 *repoCockroach.RepositorioTarifaEspecialCockroach
	repoProductos               *repoCockroach.RepositorioProductoCockroach
	repoMovimientoInventario    *repoCockroach.RepositorioMovimientoInventarioCockroach
	repoListaEspera             *repoCockroach.RepositorioListaEsperaCockroach
	repoComplementoReserva      *repoCockroach.RepositorioComplementoReservaCockroach
	repoPlantillas              *repoCockroach.RepositorioPlantillaCockroach
	repoSello                   *repoCockroach.RepositorioSelloCockroach
	repoRecordatorio            *repoCockroach.RepositorioRecordatorioCockroach
	repoAlcance                 *repoCockroach.RepositorioAlcanceCockroach
	repoSuscripcion             *repoCockroach.RepositorioSuscripcionCockroach
	repoPlan                    *repoCockroach.RepositorioPlanCockroach
	repoIdentidad               *repoCockroach.RepositorioUsuarioCockroach

	// Seguridad
	guardia    *orquestacion.GuardiaPoliticas
	middleware *MiddlewareAutenticacion
}

// exigirSuperAdmin verifica que el usuario en sesión tenga el rol SUPERADMIN.
// Retorna false y escribe 403 si no lo tiene.
func (rt *Rutas) exigirSuperAdmin(w http.ResponseWriter, r *http.Request, ses identidad.ContextoSesion) bool {
	nombreRol, _ := rt.repoAlcance.ObtenerNombreRol(r.Context(), ses.UsuarioID, ses.EmpresaID)
	if nombreRol != "SUPERADMIN" {
		ResponderError(w, http.StatusForbidden, "solo SUPERADMIN puede realizar esta operacion")
		return false
	}
	return true
}

// autorizarOResponder verifica que el usuario en sesión tiene el permiso indicado.
// Escribe la respuesta HTTP de error y retorna false si la verificación falla.
// El handler debe retornar inmediatamente si esta función retorna false.
func (rt *Rutas) autorizarOResponder(w http.ResponseWriter, r *http.Request, ses identidad.ContextoSesion, permiso string) bool {
	if err := rt.guardia.PuedeEjecutar(r.Context(), orquestacion.SolicitudAutorizacion{
		UsuarioID:     ses.UsuarioID,
		EmpresaID:     ses.EmpresaID,
		CodigoPermiso: permiso,
	}); err != nil {
		ResponderErrorDominio(w, err)
		return false
	}
	return true
}

func (rt *Rutas) Montar(r chi.Router) {
	r.Use(CORS)

	// Públicas
	r.Post("/api/auth/registrar", rt.manejarRegistrarUsuario)
	r.Post("/api/auth/sesion", rt.manejarIniciarSesion)
	r.Post("/api/auth/refresh", rt.manejarRefrescarSesion)
	// Alias frontend
	r.Post("/api/identidad/usuarios", rt.manejarRegistrarUsuario)
	r.Post("/api/identidad/sesion", rt.manejarIniciarSesion)
	// Verificación y restablecimiento (sin auth)
	r.Post("/api/auth/verificar-correo/solicitar", rt.manejarSolicitarVerificacionCorreo)
	r.Post("/api/auth/verificar-correo", rt.manejarVerificarCorreo)
	r.Post("/api/auth/restablecer-password/solicitar", rt.manejarSolicitarRestablecimientoPassword)
	r.Post("/api/auth/restablecer-password", rt.manejarRestablecerPassword)

	// Booking público (sin autenticación — clientes externos)
	r.Get("/api/publico/empresas/{empresaID}/servicios", rt.manejarServiciosPublico)
	r.Get("/api/publico/empresas/{empresaID}/barberos", rt.manejarBarberosPublico)
	r.Get("/api/publico/empresas/{empresaID}/sucursales", rt.manejarSucursalesPublico)
	r.Get("/api/publico/agenda/slots", rt.manejarSlotsPublico)
	r.Get("/api/publico/disponibilidad/barberos", rt.manejarBarberosDisponiblesPublico)
	r.Post("/api/publico/reservas", rt.manejarCrearReservaPublica)
	r.Post("/api/publico/resenas", rt.manejarRegistrarResenaPublica)
	r.Get("/api/publico/barberos/{barberoID}/reputacion", rt.manejarReputacionBarberoPublica)
	r.Post("/api/aira/conversar", rt.manejarConversarAira)
	r.Get("/api/webhook/whatsapp", rt.manejarVerificacionWebhookWhatsApp)
	r.Post("/api/webhook/whatsapp", rt.manejarWebhookWhatsApp)

	// Autenticadas
	r.Group(func(r chi.Router) {
		r.Use(rt.middleware.ValidarSesion)

		// Identidad
		r.Post("/api/auth/cerrar-sesion", rt.manejarCerrarSesion)
		r.Post("/api/usuarios/{usuarioID}/inactivar", rt.manejarInactivarUsuario)
		r.Post("/api/usuarios/cambiar-password", rt.manejarCambiarPassword)

		// Plataforma SUPERADMIN
		r.Get("/api/superadmin/empresas", rt.manejarListarEmpresasPlataforma)
		r.Post("/api/superadmin/empresas", rt.manejarOnboardearEmpresa)

		// Organización
		r.Get("/api/sucursales", rt.manejarListarSucursales)
		r.Get("/api/sucursales/todas", rt.manejarListarTodasSucursales)
		r.Patch("/api/sucursales/{sucursalID}/estado", rt.manejarActualizarEstadoSucursal)
		r.Post("/api/empresas", rt.manejarCrearEmpresa)
		r.Post("/api/empresas/{empresaID}/sucursales", rt.manejarCrearSucursal)
		r.Post("/api/empresas/{empresaID}/periodos", rt.manejarCrearPeriodo)
		r.Get("/api/periodos", rt.manejarListarPeriodos)
		r.Post("/api/periodos/{periodoID}/cerrar", rt.manejarCerrarPeriodo)
		r.Get("/api/empresas/configuracion", rt.manejarObtenerConfiguracionEmpresa)
		r.Put("/api/empresas/configuracion", rt.manejarGuardarConfiguracionEmpresa)

		// Gobierno de Acceso
		r.Post("/api/alcances", rt.manejarAsignarAlcance)
		r.Delete("/api/alcances/{alcanceID}", rt.manejarRevocarAlcance)

		// Agenda
		r.Get("/api/barberos", rt.manejarListarBarberos)
		r.Post("/api/barberos", rt.manejarRegistrarBarbero)
		r.Patch("/api/barberos/{barberoID}", rt.manejarActualizarBarbero)
		r.Patch("/api/barberos/{barberoID}/estado", rt.manejarActualizarEstadoBarbero)
		r.Post("/api/barberos/{barberoID}/servicios", rt.manejarAsignarServicioBarbero)
		r.Get("/api/barberos/{barberoID}/servicios", rt.manejarListarServiciosBarbero)
		r.Delete("/api/barberos/{barberoID}/servicios/{servicioID}", rt.manejarDesasignarServicioBarbero)
		r.Get("/api/servicios", rt.manejarListarServicios)
		r.Post("/api/servicios", rt.manejarCrearServicio)
		r.Patch("/api/servicios/{servicioID}", rt.manejarActualizarServicio)
		r.Patch("/api/servicios/{servicioID}/estado", rt.manejarActualizarEstadoServicio)
		r.Post("/api/disponibilidad", rt.manejarRegistrarDisponibilidad)
		r.Get("/api/disponibilidad/{barberoID}", rt.manejarListarDisponibilidadBarbero)
		r.Get("/api/agenda/slots", rt.manejarConsultarSlots)
		r.Post("/api/barberos/{barberoID}/excepciones", rt.manejarRegistrarExcepcionDisponibilidad)
		r.Get("/api/barberos/{barberoID}/excepciones", rt.manejarListarExcepcionesBarbero)
		r.Delete("/api/barberos/{barberoID}/excepciones/{excepcionID}", rt.manejarEliminarExcepcionDisponibilidad)

		// Reservas
		r.Post("/api/clientes", rt.manejarRegistrarCliente)
		r.Get("/api/clientes", rt.manejarListarClientes)
		r.Patch("/api/clientes/{clienteID}", rt.manejarActualizarCliente)
		r.Patch("/api/clientes/{clienteID}/estado", rt.manejarActualizarEstadoCliente)
		r.Get("/api/reservas", rt.manejarListarReservas)
		r.Post("/api/reservas", rt.manejarRegistrarReserva)
		r.Patch("/api/reservas/{reservaID}", rt.manejarActualizarReserva)
		r.Post("/api/reservas/{reservaID}/confirmar", rt.manejarConfirmarReserva)
		r.Post("/api/reservas/{reservaID}/cancelar", rt.manejarCancelarReserva)
		r.Post("/api/reservas/{reservaID}/completar", rt.manejarCompletarReserva)
		r.Post("/api/reservas/{reservaID}/no-asistio", rt.manejarMarcarNoAsistio)

		// Canal WhatsApp
		r.Post("/api/conversaciones", rt.manejarIniciarConversacion)
		r.Post("/api/mensajes", rt.manejarRegistrarMensaje)
		r.Post("/api/sesiones-chat", rt.manejarIniciarSesionChat)
		r.Patch("/api/sesiones-chat/{sesionChatID}", rt.manejarActualizarSesionChat)

		// Monetización
		r.Post("/api/suscripciones", rt.manejarActivarSuscripcion)
		r.Post("/api/suscripciones/{suscripcionID}/suspender", rt.manejarSuspenderSuscripcion)
		r.Post("/api/suscripciones/{suscripcionID}/cancelar", rt.manejarCancelarSuscripcion)
		r.Post("/api/suscripciones/{suscripcionID}/cobrar", rt.manejarCobrarSuscripcion)

		// Lealtad
		r.Post("/api/lealtad/programa", rt.manejarCrearProgramaLealtad)
		r.Post("/api/sellos", rt.manejarAcumularSello)
		r.Post("/api/sellos/{selloID}/anular", rt.manejarAnularSello)
		r.Post("/api/canjes", rt.manejarAplicarCanje)
		r.Get("/api/lealtad/programa", rt.manejarObtenerProgramaLealtad)
		r.Get("/api/lealtad/tarjetas", rt.manejarListarTarjetasLealtad)
		r.Get("/api/lealtad/tarjetas/{clienteID}", rt.manejarObtenerTarjetaCliente)
		r.Get("/api/lealtad/clientes/{clienteID}/sellos", rt.manejarListarSellosCliente)

		// Agenda — tarifas especiales
		r.Post("/api/sucursales/{sucursalID}/tarifas", rt.manejarCrearTarifaEspecial)
		r.Get("/api/sucursales/{sucursalID}/tarifas", rt.manejarListarTarifasSucursal)
		r.Delete("/api/tarifas/{tarifaID}", rt.manejarEliminarTarifaEspecial)

		// Inventario
		r.Post("/api/productos", rt.manejarCrearProducto)
		r.Get("/api/productos", rt.manejarListarProductos)
		r.Post("/api/inventario/movimientos", rt.manejarRegistrarMovimientoInventario)
		r.Get("/api/sucursales/{sucursalID}/stock", rt.manejarListarStockSucursal)

		// Complemento de reserva
		r.Post("/api/reservas/{reservaID}/complementos", rt.manejarAgregarComplementoReserva)
		r.Get("/api/reservas/{reservaID}/complementos", rt.manejarListarComplementosReserva)

		// Lista de espera
		r.Post("/api/lista-espera", rt.manejarIngresarListaEspera)
		r.Post("/api/lista-espera/{listaEsperaID}/promover", rt.manejarPromoverListaEspera)
		r.Get("/api/lista-espera", rt.manejarListarListaEspera)

		// Notificaciones
		r.Get("/api/recordatorios", rt.manejarListarRecordatorios)
		r.Post("/api/recordatorios", rt.manejarProgramarRecordatorio)
		r.Post("/api/recordatorios/{recordatorioID}/cancelar", rt.manejarCancelarRecordatorio)
		r.Post("/api/plantillas", rt.manejarCrearPlantilla)
		r.Get("/api/plantillas", rt.manejarListarPlantillas)

		// Gobierno de Acceso — listados
		r.Get("/api/alcances", rt.manejarListarAlcances)
		r.Get("/api/roles", rt.manejarListarRoles)
		r.Get("/api/usuarios", rt.manejarListarUsuarios)

		// Monetización — listados
		r.Get("/api/suscripciones", rt.manejarListarSuscripciones)
		r.Get("/api/planes", rt.manejarListarPlanes)

		// Tablero
		r.Get("/api/tablero/metricas", rt.manejarObtenerMetricasTablero)

		// Comisiones
		r.Post("/api/comisiones/esquemas", rt.manejarCrearEsquemaComision)
		r.Post("/api/comisiones/generar", rt.manejarGenerarComision)
		r.Get("/api/comisiones", rt.manejarListarComisiones)
		r.Post("/api/liquidaciones/calcular", rt.manejarCalcularLiquidacion)
		r.Post("/api/liquidaciones/{liquidacionID}/aprobar", rt.manejarAprobarLiquidacion)
		r.Post("/api/liquidaciones/{liquidacionID}/pagar", rt.manejarPagarLiquidacion)
		r.Get("/api/liquidaciones", rt.manejarListarLiquidaciones)

		// Reputación (moderación)
		r.Get("/api/resenas", rt.manejarListarResenas)
		r.Post("/api/resenas/{resenaID}/publicar", rt.manejarPublicarResena)
		r.Post("/api/resenas/{resenaID}/moderar", rt.manejarModerarResena)

		// Integraciones (Google Calendar)
		r.Post("/api/integraciones/google/conectar", rt.manejarConectarGoogle)
		r.Get("/api/integraciones/google/estado", rt.manejarEstadoGoogle)
		r.Post("/api/integraciones/google/desconectar", rt.manejarDesconectarGoogle)
		r.Post("/api/reservas/{reservaID}/sincronizar-calendar", rt.manejarSincronizarReservaCalendar)

		// Campañas
		r.Get("/api/campanias", rt.manejarListarCampanas)
		r.Post("/api/campanias", rt.manejarCrearCampana)
		r.Post("/api/campanias/{campanaID}/destinatarios/inactivos", rt.manejarCargarInactivos)
		r.Post("/api/campanias/{campanaID}/despachar", rt.manejarDespacharCampana)
	})
}

// ── Identidad ────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarRegistrarUsuario(w http.ResponseWriter, r *http.Request) {
	var s casoIdentidad.SolicitudRegistrarUsuario
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	resp, err := rt.registrarUsuario.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarIniciarSesion(w http.ResponseWriter, r *http.Request) {
	var s casoIdentidad.SolicitudIniciarSesion
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.IPOrigen = r.RemoteAddr
	resp, err := rt.iniciarSesion.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, resp)
}

func (rt *Rutas) manejarSolicitarVerificacionCorreo(w http.ResponseWriter, r *http.Request) {
	var s casoIdentidad.SolicitudSolicitarVerificacionCorreo
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	// Responder siempre OK para no revelar si el correo existe.
	_ = rt.solicitarVerificacionCorreo.Ejecutar(r.Context(), s)
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarVerificarCorreo(w http.ResponseWriter, r *http.Request) {
	var s casoIdentidad.SolicitudVerificarCorreo
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if err := rt.verificarCorreo.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarSolicitarRestablecimientoPassword(w http.ResponseWriter, r *http.Request) {
	var s casoIdentidad.SolicitudSolicitarRestablecimientoPassword
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	// Responder siempre OK para no revelar si el correo existe.
	_ = rt.solicitarRestablecimientoPassword.Ejecutar(r.Context(), s)
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarRestablecerPassword(w http.ResponseWriter, r *http.Request) {
	var s casoIdentidad.SolicitudRestablecerPassword
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if err := rt.restablecerPassword.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarCerrarSesion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if err := rt.cerrarSesion.Ejecutar(r.Context(), sesion.SesionID, sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarInactivarUsuario(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.UsuarioInactivar) {
		return
	}
	usuarioID := chi.URLParam(r, "usuarioID")
	if err := rt.inactivarUsuario.Ejecutar(r.Context(), usuarioID, sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarCambiarPassword(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	var s casoIdentidad.SolicitudCambiarPassword
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.UsuarioID = sesion.UsuarioID
	s.EmpresaID = sesion.EmpresaID
	if err := rt.cambiarPassword.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

// ── Organización ─────────────────────────────────────────────────────────────

func (rt *Rutas) manejarCrearEmpresa(w http.ResponseWriter, r *http.Request) {
	// Operación de plataforma — solo SUPERADMIN puede crear empresas (evita escalada de privilegios).
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_requerida")
		return
	}
	if !rt.exigirSuperAdmin(w, r, sesion) {
		return
	}

	var s casoOrg.SolicitudCrearEmpresa
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.crearEmpresa.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarCrearSucursal(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.SedeCrear) {
		return
	}
	var s casoOrg.SolicitudCrearSucursal
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = chi.URLParam(r, "empresaID")
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.crearSucursal.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarCrearPeriodo(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.PeriodoCrear) {
		return
	}
	var s casoOrg.SolicitudCrearPeriodo
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = chi.URLParam(r, "empresaID")
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.crearPeriodo.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarCerrarPeriodo(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.PeriodoCerrar) {
		return
	}
	periodoID := chi.URLParam(r, "periodoID")
	if err := rt.cerrarPeriodo.Ejecutar(r.Context(), periodoID, sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarObtenerConfiguracionEmpresa(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	config, err := rt.repoEmpresa.ObtenerConfiguracion(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, config)
}

func (rt *Rutas) manejarGuardarConfiguracionEmpresa(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	var s casoOrg.SolicitudGuardarConfiguracionEmpresa
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = sesion.EmpresaID
	s.ActualizadoPor = sesion.UsuarioID
	if err := rt.guardarConfiguracion.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarActualizarEstadoSucursal(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	sucursalID := chi.URLParam(r, "sucursalID")
	var cuerpo struct {
		Estado string `json:"estado"`
	}
	if err := json.NewDecoder(r.Body).Decode(&cuerpo); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s := casoOrg.SolicitudActualizarEstadoSucursal{
		SucursalID:     sucursalID,
		EmpresaID:      sesion.EmpresaID,
		Estado:         cuerpo.Estado,
		ActualizadoPor: sesion.UsuarioID,
	}
	if err := rt.actualizarEstadoSucursal.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarSucursales(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoSucursales.ListarActivas(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	if lista == nil {
		lista = []sedes.Sucursal{}
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarListarTodasSucursales(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoSucursales.ListarTodas(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error al listar sedes")
		return
	}
	if lista == nil {
		lista = []sedes.Sucursal{}
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarListarPeriodos(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoPeriodo.ListarTodos(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error al listar períodos")
		return
	}
	if lista == nil {
		lista = []periodos.Periodo{}
	}
	ResponderOK(w, lista)
}

// ── Gobierno de Acceso ────────────────────────────────────────────────────────

func (rt *Rutas) manejarAsignarAlcance(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.AlcanceAsignar) {
		return
	}
	var s casoGobierno.SolicitudAsignarAlcance
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.AsignadoPor = sesion.UsuarioID
	resp, err := rt.asignarAlcance.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarRevocarAlcance(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.AlcanceRevocar) {
		return
	}
	alcanceID := chi.URLParam(r, "alcanceID")
	if err := rt.revocarAlcance.Ejecutar(r.Context(), alcanceID, sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarAlcances(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoAlcance.ListarAlcancesPorEmpresa(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarListarRoles(w http.ResponseWriter, r *http.Request) {
	lista, err := rt.repoAlcance.ListarRoles(r.Context())
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarListarUsuarios(w http.ResponseWriter, r *http.Request) {
	lista, err := rt.repoIdentidad.ListarActivos(r.Context())
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

// ── Agenda ────────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarListarBarberos(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoBarberos.ListarActivos(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarRegistrarBarbero(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.BarberoRegistrar) {
		return
	}
	var s casoAgenda.SolicitudRegistrarBarbero
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.CreadoPor = sesion.UsuarioID
	if s.EmpresaID == "" {
		s.EmpresaID = sesion.EmpresaID
	}
	resp, err := rt.registrarBarbero.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarActualizarBarbero(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	barberoID := chi.URLParam(r, "barberoID")
	var body struct {
		Nombre   string `json:"nombre"`
		Telefono string `json:"telefono"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if body.Nombre == "" {
		ResponderError(w, http.StatusBadRequest, "nombre_requerido")
		return
	}
	s := casoAgenda.SolicitudActualizarBarbero{
		BarberoID:      barberoID,
		EmpresaID:      sesion.EmpresaID,
		Nombre:         body.Nombre,
		Telefono:       body.Telefono,
		ActualizadoPor: sesion.UsuarioID,
	}
	if err := rt.actualizarBarbero.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarActualizarEstadoBarbero(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	barberoID := chi.URLParam(r, "barberoID")
	var body struct {
		Estado string `json:"estado"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s := casoAgenda.SolicitudActualizarEstadoBarbero{
		BarberoID:      barberoID,
		EmpresaID:      sesion.EmpresaID,
		Estado:         body.Estado,
		ActualizadoPor: sesion.UsuarioID,
	}
	if err := rt.actualizarEstadoBarbero.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarAsignarServicioBarbero(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.BarberoServicioAsignar) {
		return
	}
	var body struct {
		ServicioID string `json:"servicio_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s := casoAgenda.SolicitudAsignarServicioBarbero{
		BarberoID:   chi.URLParam(r, "barberoID"),
		ServicioID:  body.ServicioID,
		EmpresaID:   sesion.EmpresaID,
		AsignadoPor: sesion.UsuarioID,
	}
	if err := rt.asignarServicioBarbero.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarServiciosBarbero(w http.ResponseWriter, r *http.Request) {
	barberoID := chi.URLParam(r, "barberoID")
	lista, err := rt.repoBarberos.ListarServiciosBarbero(r.Context(), barberoID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarDesasignarServicioBarbero(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	s := casoAgenda.SolicitudDesasignarServicioBarbero{
		BarberoID:   chi.URLParam(r, "barberoID"),
		ServicioID:  chi.URLParam(r, "servicioID"),
		EmpresaID:   sesion.EmpresaID,
		AsignadoPor: sesion.UsuarioID,
	}
	if err := rt.desasignarServicio.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarServicios(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoServicios.ListarTodos(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarCrearServicio(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ServicioRegistrar) {
		return
	}
	var s casoAgenda.SolicitudCrearServicio
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.CreadoPor = sesion.UsuarioID
	if s.EmpresaID == "" {
		s.EmpresaID = sesion.EmpresaID
	}
	resp, err := rt.crearServicio.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarActualizarServicio(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	servicioID := chi.URLParam(r, "servicioID")
	var body struct {
		Nombre          string  `json:"nombre"`
		DuracionMinutos int     `json:"duracion_minutos"`
		Precio          float64 `json:"precio"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if body.Nombre == "" {
		ResponderError(w, http.StatusBadRequest, "nombre_requerido")
		return
	}
	if body.DuracionMinutos <= 0 {
		ResponderError(w, http.StatusBadRequest, "duracion_invalida")
		return
	}
	s := casoAgenda.SolicitudActualizarServicio{
		ServicioID:      servicioID,
		EmpresaID:       sesion.EmpresaID,
		Nombre:          body.Nombre,
		DuracionMinutos: body.DuracionMinutos,
		Precio:          body.Precio,
		ActualizadoPor:  sesion.UsuarioID,
	}
	if err := rt.actualizarServicio.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarActualizarEstadoServicio(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	servicioID := chi.URLParam(r, "servicioID")
	var body struct {
		Estado string `json:"estado"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s := casoAgenda.SolicitudActualizarEstadoServicio{
		ServicioID:     servicioID,
		EmpresaID:      sesion.EmpresaID,
		Estado:         body.Estado,
		ActualizadoPor: sesion.UsuarioID,
	}
	if err := rt.actualizarEstadoServicio.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarRegistrarDisponibilidad(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.DisponibilidadCrear) {
		return
	}
	var s casoAgenda.SolicitudRegistrarDisponibilidad
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.CreadoPor = sesion.UsuarioID
	s.EmpresaID = sesion.EmpresaID
	if s.SucursalID == "" {
		s.SucursalID = sesion.SucursalID
	}
	if s.SucursalID == "" {
		// Fallback: primera sucursal activa de la empresa
		s.SucursalID = rt.repoDisponibilidad.ObtenerPrimeraSucursalActiva(r.Context(), sesion.EmpresaID)
	}
	resp, err := rt.registrarDisponibilidad.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarListarDisponibilidadBarbero(w http.ResponseWriter, r *http.Request) {
	barberoID := chi.URLParam(r, "barberoID")
	lista, err := rt.repoDisponibilidad.ListarPorBarbero(r.Context(), barberoID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarConsultarSlots(w http.ResponseWriter, r *http.Request) {
	barberoID := r.URL.Query().Get("barbero_id")
	servicioID := r.URL.Query().Get("servicio_id")
	fecha := r.URL.Query().Get("fecha")
	if barberoID == "" || servicioID == "" || fecha == "" {
		ResponderError(w, http.StatusBadRequest, "faltan_parametros")
		return
	}
	resultado, err := rt.repoDisponibilidad.ConsultarSlots(r.Context(), barberoID, servicioID, fecha)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, resultado)
}

func (rt *Rutas) manejarRegistrarExcepcionDisponibilidad(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ExcepcionDisponibilidadRegistrar) {
		return
	}
	var s casoAgenda.SolicitudRegistrarExcepcionDisponibilidad
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.BarberoID = chi.URLParam(r, "barberoID")
	s.CreadoPor = sesion.UsuarioID
	s.EmpresaID = sesion.EmpresaID
	if s.SucursalID == "" {
		s.SucursalID = sesion.SucursalID
	}
	if s.SucursalID == "" {
		s.SucursalID = rt.repoDisponibilidad.ObtenerPrimeraSucursalActiva(r.Context(), sesion.EmpresaID)
	}
	resp, err := rt.registrarExcepcionDisponibilidad.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarListarExcepcionesBarbero(w http.ResponseWriter, r *http.Request) {
	barberoID := chi.URLParam(r, "barberoID")
	lista, err := rt.repoExcepcionDisponibilidad.ListarPorBarbero(r.Context(), barberoID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarEliminarExcepcionDisponibilidad(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ExcepcionDisponibilidadRegistrar) {
		return
	}
	excepcionID := chi.URLParam(r, "excepcionID")
	if err := rt.repoExcepcionDisponibilidad.Eliminar(r.Context(), excepcionID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

// ── Reservas ──────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarRegistrarCliente(w http.ResponseWriter, r *http.Request) {
	// Cualquier usuario autenticado puede registrar clientes
	var s casoReservas.SolicitudRegistrarCliente
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if sesion, ok := identidad.SesionDesdeContexto(r.Context()); ok {
		s.CreadoPor = sesion.UsuarioID
		if s.EmpresaID == "" {
			s.EmpresaID = sesion.EmpresaID
		}
	}
	resp, err := rt.registrarCliente.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarListarClientes(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoClientes.ListarPorEmpresa(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarActualizarCliente(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	clienteID := chi.URLParam(r, "clienteID")
	var body struct {
		Nombre   string `json:"nombre"`
		Telefono string `json:"telefono"`
		Correo   string `json:"correo_electronico"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if body.Nombre == "" {
		ResponderError(w, http.StatusBadRequest, "nombre_requerido")
		return
	}
	s := casoReservas.SolicitudActualizarCliente{
		ClienteID:      clienteID,
		EmpresaID:      sesion.EmpresaID,
		Nombre:         body.Nombre,
		Telefono:       body.Telefono,
		Correo:         body.Correo,
		ActualizadoPor: sesion.UsuarioID,
	}
	if err := rt.actualizarCliente.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarActualizarEstadoCliente(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	clienteID := chi.URLParam(r, "clienteID")
	var body struct {
		Estado string `json:"estado"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s := casoReservas.SolicitudActualizarEstadoCliente{
		ClienteID:      clienteID,
		EmpresaID:      sesion.EmpresaID,
		Estado:         body.Estado,
		ActualizadoPor: sesion.UsuarioID,
	}
	if err := rt.actualizarEstadoCliente.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarReservas(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoReservas.ListarPorEmpresa(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarRegistrarReserva(w http.ResponseWriter, r *http.Request) {
	// Cualquier usuario autenticado puede crear reservas
	var s casoReservas.SolicitudRegistrarReserva
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if sesion, ok := identidad.SesionDesdeContexto(r.Context()); ok {
		s.CreadoPor = sesion.UsuarioID
		if s.EmpresaID == "" {
			s.EmpresaID = sesion.EmpresaID
		}
		if s.SucursalID == "" {
			s.SucursalID = sesion.SucursalID
		}
	}
	resp, err := rt.registrarReserva.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarActualizarReserva(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	reservaID := chi.URLParam(r, "reservaID")
	var body struct {
		ClienteID       string `json:"cliente_id"`
		BarberoID       string `json:"barbero_id"`
		ServicioID      string `json:"servicio_id"`
		FechaHoraInicio string `json:"fecha_hora_inicio"`
		Origen          string `json:"origen"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if body.ClienteID == "" || body.BarberoID == "" || body.ServicioID == "" || body.FechaHoraInicio == "" {
		ResponderError(w, http.StatusBadRequest, "campos_requeridos")
		return
	}
	origenesValidos := map[string]bool{"MANUAL": true, "WHATSAPP": true, "WEB": true}
	if body.Origen != "" && !origenesValidos[body.Origen] {
		ResponderError(w, http.StatusBadRequest, "origen_invalido")
		return
	}
	if body.Origen == "" {
		body.Origen = "MANUAL"
	}
	s := casoReservas.SolicitudActualizarReserva{
		ReservaID:       reservaID,
		EmpresaID:       sesion.EmpresaID,
		ClienteID:       body.ClienteID,
		BarberoID:       body.BarberoID,
		ServicioID:      body.ServicioID,
		FechaHoraInicio: body.FechaHoraInicio,
		Origen:          body.Origen,
		ActualizadoPor:  sesion.UsuarioID,
	}
	if err := rt.actualizarReserva.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarConfirmarReserva(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReservaConfirmar) {
		return
	}
	if err := rt.confirmarReserva.Ejecutar(r.Context(), chi.URLParam(r, "reservaID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarCancelarReserva(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReservaCancelar) {
		return
	}
	if err := rt.cancelarReserva.Ejecutar(r.Context(), chi.URLParam(r, "reservaID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarCompletarReserva(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReservaCompletar) {
		return
	}
	if err := rt.completarReserva.Ejecutar(r.Context(), chi.URLParam(r, "reservaID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarMarcarNoAsistio(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReservaCompletar) {
		return
	}
	if err := rt.marcarNoAsistio.Ejecutar(r.Context(), chi.URLParam(r, "reservaID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

// ── Canal WhatsApp ────────────────────────────────────────────────────────────

func (rt *Rutas) manejarIniciarConversacion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.CanalGestionar) {
		return
	}
	var s casoCanal.SolicitudIniciarConversacion
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	// La empresa la fija el contexto operativo, no el cuerpo (evita cruce de inquilinos).
	s.EmpresaID = sesion.EmpresaID
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.iniciarConversacion.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarRegistrarMensaje(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.CanalGestionar) {
		return
	}
	var s casoCanal.SolicitudRegistrarMensaje
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if !rt.exigirConversacionDelTenant(w, r, s.ConversacionID, sesion.EmpresaID) {
		return
	}
	resp, err := rt.registrarMensaje.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarIniciarSesionChat(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.CanalGestionar) {
		return
	}
	var s casoCanal.SolicitudIniciarSesionChat
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if !rt.exigirConversacionDelTenant(w, r, s.ConversacionID, sesion.EmpresaID) {
		return
	}
	resp, err := rt.gestionarSesionChat.Iniciar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarActualizarSesionChat(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.CanalGestionar) {
		return
	}
	var s casoCanal.SolicitudActualizarSesionChat
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.SesionChatID = chi.URLParam(r, "sesionChatID")
	if !rt.exigirSesionChatDelTenant(w, r, s.SesionChatID, sesion.EmpresaID) {
		return
	}
	if err := rt.gestionarSesionChat.Actualizar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

// ── Monetización ──────────────────────────────────────────────────────────────

func (rt *Rutas) manejarActivarSuscripcion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.SuscripcionGestionar) {
		return
	}
	var s casoMonetizacion.SolicitudActivarSuscripcion
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.ActivadoPor = sesion.UsuarioID
	resp, err := rt.activarSuscripcion.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarCobrarSuscripcion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.SuscripcionGestionar) {
		return
	}
	resp, err := rt.cobrarSuscripcion.Ejecutar(r.Context(), casoMonetizacion.SolicitudCobrarSuscripcion{
		SuscripcionID: chi.URLParam(r, "suscripcionID"),
		EmpresaID:     sesion.EmpresaID,
		CobradoPor:    sesion.UsuarioID,
	})
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, resp)
}

func (rt *Rutas) manejarSuspenderSuscripcion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.SuscripcionGestionar) {
		return
	}
	if err := rt.suspenderSuscripcion.Ejecutar(r.Context(), chi.URLParam(r, "suscripcionID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarCancelarSuscripcion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.SuscripcionGestionar) {
		return
	}
	if err := rt.cancelarSuscripcion.Ejecutar(r.Context(), chi.URLParam(r, "suscripcionID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarSuscripciones(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.SuscripcionGestionar) {
		return
	}
	lista, err := rt.repoSuscripcion.ListarPorEmpresa(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarListarPlanes(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.SuscripcionGestionar) {
		return
	}
	lista, err := rt.repoPlan.ListarActivos(r.Context())
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

// ── Lealtad ───────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarCrearProgramaLealtad(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ProgramaLealtadGestionar) {
		return
	}
	var s casoLealtad.SolicitudCrearProgramaLealtad
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = sesion.EmpresaID
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.crearProgramaLealtad.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarAcumularSello(w http.ResponseWriter, r *http.Request) {
	// Cualquier usuario autenticado puede acumular sellos (barbero lo hace al terminar servicio)
	var s casoLealtad.SolicitudAcumularSello
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if sesion, ok := identidad.SesionDesdeContexto(r.Context()); ok {
		s.RegistradoPor = sesion.UsuarioID
		if s.EmpresaID == "" {
			s.EmpresaID = sesion.EmpresaID
		}
	}
	resp, err := rt.acumularSello.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarAnularSello(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.SelloGestionar) {
		return
	}
	var body struct {
		MotivoAnulacion string `json:"motivo_anulacion"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if err := rt.anularSello.Ejecutar(r.Context(), chi.URLParam(r, "selloID"), body.MotivoAnulacion, sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarAplicarCanje(w http.ResponseWriter, r *http.Request) {
	// Cualquier usuario autenticado puede aplicar canjes (barbero lo hace en caja)
	var s casoLealtad.SolicitudAplicarCanje
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if sesion, ok := identidad.SesionDesdeContexto(r.Context()); ok {
		s.CreadoPor = sesion.UsuarioID
		s.EmpresaID = sesion.EmpresaID
	}
	resp, err := rt.aplicarCanje.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarObtenerProgramaLealtad(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	programa, err := rt.repoSello.ObtenerProgramaActivo(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusNotFound, "programa_lealtad_no_encontrado")
		return
	}
	ResponderOK(w, programa)
}

func (rt *Rutas) manejarListarTarjetasLealtad(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoSello.ListarTarjetas(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarObtenerTarjetaCliente(w http.ResponseWriter, r *http.Request) {
	clienteID := chi.URLParam(r, "clienteID")
	tarjeta, err := rt.repoSello.ObtenerTarjetaPorCliente(r.Context(), clienteID)
	if err != nil {
		ResponderError(w, http.StatusNotFound, "tarjeta_no_encontrada")
		return
	}
	ResponderOK(w, tarjeta)
}

func (rt *Rutas) manejarListarSellosCliente(w http.ResponseWriter, r *http.Request) {
	clienteID := chi.URLParam(r, "clienteID")
	lista, err := rt.repoSello.ListarSellosActivos(r.Context(), clienteID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error al listar sellos")
		return
	}
	ResponderOK(w, lista)
}

// ── Notificaciones ────────────────────────────────────────────────────────────

func (rt *Rutas) manejarProgramarRecordatorio(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.RecordatorioGestionar) {
		return
	}
	var s casoNotificaciones.SolicitudProgramarRecordatorio
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.CreadoPor = sesion.UsuarioID
	s.EmpresaID = sesion.EmpresaID
	resp, err := rt.programarRecordatorio.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarCancelarRecordatorio(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.RecordatorioGestionar) {
		return
	}
	if err := rt.cancelarRecordatorio.Ejecutar(r.Context(), chi.URLParam(r, "recordatorioID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarRecordatorios(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoRecordatorio.ListarPorEmpresa(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error al listar recordatorios")
		return
	}
	ResponderOK(w, lista)
}

// ── Plantillas ────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarCrearPlantilla(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.PlantillaGestionar) {
		return
	}
	var s casoNotificaciones.SolicitudCrearPlantilla
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = sesion.EmpresaID
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.crearPlantilla.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarListarPlantillas(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoPlantillas.ListarPorEmpresa(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

// ── TarifaEspecial ────────────────────────────────────────────────────────────

func (rt *Rutas) manejarCrearTarifaEspecial(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.TarifaEspecialCrear) {
		return
	}
	var s casoAgenda.SolicitudCrearTarifaEspecial
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.SucursalID = chi.URLParam(r, "sucursalID")
	s.EmpresaID = sesion.EmpresaID
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.crearTarifaEspecial.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarListarTarifasSucursal(w http.ResponseWriter, r *http.Request) {
	sucursalID := chi.URLParam(r, "sucursalID")
	lista, err := rt.repoTarifas.ListarPorSucursal(r.Context(), sucursalID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarEliminarTarifaEspecial(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.TarifaEspecialCrear) {
		return
	}
	if err := rt.repoTarifas.Eliminar(r.Context(), chi.URLParam(r, "tarifaID")); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

// ── Inventario ────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarCrearProducto(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.InventarioGestionar) {
		return
	}
	var s casoInventario.SolicitudCrearProducto
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if s.EmpresaID == "" {
		s.EmpresaID = sesion.EmpresaID
	}
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.crearProducto.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarListarProductos(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoProductos.ListarPorEmpresa(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarRegistrarMovimientoInventario(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.InventarioGestionar) {
		return
	}
	var s casoInventario.SolicitudRegistrarMovimientoInventario
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = sesion.EmpresaID
	s.RegistradoPor = sesion.UsuarioID
	resp, err := rt.registrarMovimientoInventario.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarListarStockSucursal(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	sucursalID := chi.URLParam(r, "sucursalID")
	// Control técnico: la sucursal debe pertenecer a la empresa de la sesión (evita fuga cross-tenant).
	sucursal, err := rt.repoSucursales.ObtenerActiva(r.Context(), sucursalID)
	if err != nil || sucursal.EmpresaID != sesion.EmpresaID {
		ResponderError(w, http.StatusForbidden, "sucursal_fuera_de_contexto")
		return
	}
	lista, err := rt.repoMovimientoInventario.ListarStockPorSucursal(r.Context(), sucursalID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

// ── Complemento de Reserva ────────────────────────────────────────────────────

func (rt *Rutas) manejarAgregarComplementoReserva(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReservaActualizar) {
		return
	}
	var s casoReservas.SolicitudAgregarComplementoReserva
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.ReservaID = chi.URLParam(r, "reservaID")
	s.EmpresaID = sesion.EmpresaID
	s.RegistradoPor = sesion.UsuarioID
	if err := rt.agregarComplementoReserva.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarComplementosReserva(w http.ResponseWriter, r *http.Request) {
	reservaID := chi.URLParam(r, "reservaID")
	lista, err := rt.repoComplementoReserva.ListarPorReserva(r.Context(), reservaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

// ── Lista de Espera ───────────────────────────────────────────────────────────

func (rt *Rutas) manejarIngresarListaEspera(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReservaActualizar) {
		return
	}
	var s casoReservas.SolicitudIngresarListaEspera
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if s.EmpresaID == "" {
		s.EmpresaID = sesion.EmpresaID
	}
	s.CreadoPor = sesion.UsuarioID
	resp, err := rt.ingresarListaEspera.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}

func (rt *Rutas) manejarPromoverListaEspera(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReservaActualizar) {
		return
	}
	if err := rt.promoverListaEspera.Ejecutar(r.Context(), chi.URLParam(r, "listaEsperaID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

// ── Comisiones ────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarCrearEsquemaComision(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ComisionGestionar) {
		return
	}
	var s casoComisiones.SolicitudCrearEsquema
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = sesion.EmpresaID
	s.CreadoPor = sesion.UsuarioID
	id, err := rt.crearEsquemaComision.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, map[string]string{"id_esquema": id})
}

func (rt *Rutas) manejarGenerarComision(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ComisionGestionar) {
		return
	}
	var s struct {
		ReservaID string `json:"reserva_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	id, err := rt.generarComision.Ejecutar(r.Context(), s.ReservaID, sesion.UsuarioID, sesion.EmpresaID)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, map[string]string{"id_comision": id})
}

func (rt *Rutas) manejarListarComisiones(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ComisionGestionar) {
		return
	}
	q := r.URL.Query()
	lista, err := rt.repoComision.ListarComisiones(r.Context(), sesion.EmpresaID, q.Get("barbero_id"), q.Get("desde"), q.Get("hasta"))
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarCalcularLiquidacion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ComisionGestionar) {
		return
	}
	var s casoComisiones.SolicitudCalcularLiquidacion
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = sesion.EmpresaID
	s.CalculadoPor = sesion.UsuarioID
	id, err := rt.calcularLiquidacion.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, map[string]string{"id_liquidacion": id})
}

func (rt *Rutas) manejarAprobarLiquidacion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ComisionGestionar) {
		return
	}
	if err := rt.aprobarLiquidacion.Ejecutar(r.Context(), chi.URLParam(r, "liquidacionID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarPagarLiquidacion(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ComisionGestionar) {
		return
	}
	if err := rt.pagarLiquidacion.Ejecutar(r.Context(), chi.URLParam(r, "liquidacionID"), sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarListarLiquidaciones(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ComisionGestionar) {
		return
	}
	lista, err := rt.repoComision.ListarLiquidaciones(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

// ── Reputación ────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarRegistrarResenaPublica(w http.ResponseWriter, r *http.Request) {
	var s casoReputacion.SolicitudRegistrarResena
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if s.ReservaID == "" {
		ResponderError(w, http.StatusBadRequest, "campos_requeridos")
		return
	}
	id, err := rt.registrarResena.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, map[string]string{"id_resena": id})
}

func (rt *Rutas) manejarReputacionBarberoPublica(w http.ResponseWriter, r *http.Request) {
	rep, err := rt.repoReputacion.PromedioBarbero(r.Context(), chi.URLParam(r, "barberoID"))
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, rep)
}

// manejarConversarAira simula un mensaje entrante de WhatsApp para el bot Aira IA.
// En producción el webhook de Meta invocará el mismo caso de uso.
func (rt *Rutas) manejarConversarAira(w http.ResponseWriter, r *http.Request) {
	var s struct {
		EmpresaID     string `json:"empresa_id"`
		NumeroCliente string `json:"numero_cliente"`
		Texto         string `json:"texto"`
	}
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if s.EmpresaID == "" || s.NumeroCliente == "" || s.Texto == "" {
		ResponderError(w, http.StatusBadRequest, "campos_requeridos")
		return
	}
	empresaID, ok := rt.resolverEmpresaPublica(w, r, s.EmpresaID)
	if !ok {
		return
	}
	resp, err := rt.conversarAira.Ejecutar(r.Context(), casoCanal.SolicitudConversarAira{
		EmpresaID:     empresaID,
		NumeroCliente: s.NumeroCliente,
		Texto:         s.Texto,
	})
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, resp)
}

// exigirConversacionDelTenant verifica que la conversación pertenezca a la empresa
// del contexto operativo. Responde 404 (no revela existencia ajena) y devuelve false.
func (rt *Rutas) exigirConversacionDelTenant(w http.ResponseWriter, r *http.Request, conversacionID, empresaID string) bool {
	duena, err := rt.repoConversacionWA.EmpresaDeConversacion(r.Context(), conversacionID)
	if err != nil || duena != empresaID {
		ResponderError(w, http.StatusNotFound, "conversacion_no_encontrada")
		return false
	}
	return true
}

// exigirSesionChatDelTenant verifica que la sesión de chat pertenezca a la empresa
// del contexto operativo (vía su conversación). Responde 404 y devuelve false.
func (rt *Rutas) exigirSesionChatDelTenant(w http.ResponseWriter, r *http.Request, sesionChatID, empresaID string) bool {
	duena, err := rt.repoSesionChatWA.EmpresaDeSesionChat(r.Context(), sesionChatID)
	if err != nil || duena != empresaID {
		ResponderError(w, http.StatusNotFound, "sesion_chat_no_encontrada")
		return false
	}
	return true
}

// manejarVerificacionWebhookWhatsApp responde el handshake GET que Meta hace al
// registrar la URL del webhook: devuelve hub.challenge si el verify_token coincide.
func (rt *Rutas) manejarVerificacionWebhookWhatsApp(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	tokenEsperado := os.Getenv("WHATSAPP_VERIFY_TOKEN")
	if q.Get("hub.mode") == "subscribe" && tokenEsperado != "" && q.Get("hub.verify_token") == tokenEsperado {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(q.Get("hub.challenge")))
		return
	}
	w.WriteHeader(http.StatusForbidden)
}

// manejarWebhookWhatsApp recibe los mensajes entrantes de Meta. Desempaqueta el
// envoltorio de transporte y deja que Aira IA conduzca cada conversación. Siempre
// responde 200 rápido (Meta reintenta el envío si no recibe 200 a tiempo).
func (rt *Rutas) manejarWebhookWhatsApp(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Entry []struct {
			Changes []struct {
				Value struct {
					Metadata struct {
						PhoneNumberID string `json:"phone_number_id"`
					} `json:"metadata"`
					Messages []struct {
						From string `json:"from"`
						Type string `json:"type"`
						Text struct {
							Body string `json:"body"`
						} `json:"text"`
					} `json:"messages"`
				} `json:"value"`
			} `json:"changes"`
		} `json:"entry"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusOK) // payload corrupto: no pedir reintento a Meta
		return
	}
	for _, entrada := range payload.Entry {
		for _, cambio := range entrada.Changes {
			numeroMeta := cambio.Value.Metadata.PhoneNumberID
			for _, msg := range cambio.Value.Messages {
				if msg.Type != "text" || msg.Text.Body == "" {
					continue
				}
				_, _ = rt.recibirWebhookWA.Ejecutar(r.Context(), casoCanal.MensajeEntranteWA{
					NumeroTelefonoMeta: numeroMeta,
					NumeroCliente:      msg.From,
					Texto:              msg.Text.Body,
				})
			}
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (rt *Rutas) manejarListarResenas(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReputacionGestionar) {
		return
	}
	lista, err := rt.repoReputacion.ListarResenas(r.Context(), sesion.EmpresaID, r.URL.Query().Get("estado"))
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarPublicarResena(w http.ResponseWriter, r *http.Request) {
	rt.cambiarEstadoResena(w, r, "PUBLICADA")
}

func (rt *Rutas) manejarModerarResena(w http.ResponseWriter, r *http.Request) {
	rt.cambiarEstadoResena(w, r, "MODERADA")
}

func (rt *Rutas) cambiarEstadoResena(w http.ResponseWriter, r *http.Request, estado string) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.ReputacionGestionar) {
		return
	}
	if err := rt.actualizarEstadoResena.Ejecutar(r.Context(), chi.URLParam(r, "resenaID"), estado, sesion.UsuarioID, sesion.EmpresaID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

// ── Integraciones (Google Calendar) ──────────────────────────────────────────

func (rt *Rutas) manejarConectarGoogle(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.IntegracionGestionar) {
		return
	}
	var s casoIntegraciones.SolicitudConectarGoogle
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = sesion.EmpresaID
	s.ConectadoPor = sesion.UsuarioID
	if err := rt.conectarGoogle.Ejecutar(r.Context(), s); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarEstadoGoogle(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.IntegracionGestionar) {
		return
	}
	estado, err := rt.repoIntegracion.ObtenerEstadoGoogle(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, estado)
}

func (rt *Rutas) manejarDesconectarGoogle(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.IntegracionGestionar) {
		return
	}
	if err := rt.desconectarGoogle.Ejecutar(r.Context(), sesion.EmpresaID, sesion.UsuarioID); err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, nil)
}

func (rt *Rutas) manejarSincronizarReservaCalendar(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.IntegracionGestionar) {
		return
	}
	id, err := rt.sincronizarReserva.Ejecutar(r.Context(), chi.URLParam(r, "reservaID"), sesion.EmpresaID, sesion.UsuarioID)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, map[string]string{"id_evento_calendar": id})
}

// ── Campañas ──────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarCrearCampana(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.CampanaGestionar) {
		return
	}
	var s casoCampanias.SolicitudCrearCampana
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.EmpresaID = sesion.EmpresaID
	s.CreadoPor = sesion.UsuarioID
	id, err := rt.crearCampana.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, map[string]string{"id_campana": id})
}

func (rt *Rutas) manejarCargarInactivos(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.CampanaGestionar) {
		return
	}
	var s struct {
		Dias int `json:"dias"`
	}
	_ = json.NewDecoder(r.Body).Decode(&s)
	if s.Dias <= 0 {
		s.Dias = 60
	}
	n, err := rt.cargarInactivos.Ejecutar(r.Context(), chi.URLParam(r, "campanaID"), s.Dias, sesion.UsuarioID)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, map[string]int{"total_destinatarios": n})
}

func (rt *Rutas) manejarDespacharCampana(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.CampanaGestionar) {
		return
	}
	n, err := rt.despacharCampana.Ejecutar(r.Context(), chi.URLParam(r, "campanaID"), sesion.EmpresaID, sesion.UsuarioID)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, map[string]int{"enviados": n})
}

func (rt *Rutas) manejarListarCampanas(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	if !rt.autorizarOResponder(w, r, sesion, permisos.CampanaGestionar) {
		return
	}
	lista, err := rt.repoCampana.ListarCampanas(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarListarListaEspera(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_no_encontrada")
		return
	}
	lista, err := rt.repoListaEspera.ListarPorEmpresa(r.Context(), sesion.EmpresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

func (rt *Rutas) manejarRefrescarSesion(w http.ResponseWriter, r *http.Request) {
	var s casoIdentidad.SolicitudRefrescarSesion
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	resp, err := rt.refrescarSesion.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, resp)
}

// ── Handlers públicos (sin autenticación) ─────────────────────────────────────

// resolverEmpresaPublica acepta un UUID o un slug legible.
// Si el param tiene 36 caracteres y contiene guiones (UUID v4), lo usa directamente.
// Si no, resuelve el slug contra la BD.
func (rt *Rutas) resolverEmpresaPublica(w http.ResponseWriter, r *http.Request, param string) (string, bool) {
	if len(param) == 36 && strings.Contains(param, "-") {
		return param, true
	}
	id, err := rt.repoEmpresa.ResolverSlug(r.Context(), param)
	if err != nil || id == "" {
		ResponderError(w, http.StatusNotFound, "barberia_no_encontrada")
		return "", false
	}
	return id, true
}

func (rt *Rutas) manejarServiciosPublico(w http.ResponseWriter, r *http.Request) {
	param := chi.URLParam(r, "empresaID")
	if param == "" {
		ResponderError(w, http.StatusBadRequest, "empresa_requerida")
		return
	}
	empresaID, ok := rt.resolverEmpresaPublica(w, r, param)
	if !ok {
		return
	}
	lista, err := rt.repoServicios.ListarTodos(r.Context(), empresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarBarberosPublico(w http.ResponseWriter, r *http.Request) {
	param := chi.URLParam(r, "empresaID")
	if param == "" {
		ResponderError(w, http.StatusBadRequest, "empresa_requerida")
		return
	}
	empresaID, ok := rt.resolverEmpresaPublica(w, r, param)
	if !ok {
		return
	}
	lista, err := rt.repoBarberos.ListarActivos(r.Context(), empresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

// manejarBarberosDisponiblesPublico responde "¿qué barberos están libres en esta
// sede, a esta fecha/hora, para este servicio?" — usado por la wizard de reserva pública.
func (rt *Rutas) manejarBarberosDisponiblesPublico(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	param := q.Get("empresa_id")
	if param == "" {
		ResponderError(w, http.StatusBadRequest, "empresa_requerida")
		return
	}
	empresaID, ok := rt.resolverEmpresaPublica(w, r, param)
	if !ok {
		return
	}
	lista, err := rt.repoBarberos.BarberosDisponiblesPorSede(
		r.Context(), empresaID, q.Get("sucursal_id"), q.Get("servicio_id"), q.Get("fecha_hora_inicio"),
	)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	ResponderOK(w, lista)
}

func (rt *Rutas) manejarSucursalesPublico(w http.ResponseWriter, r *http.Request) {
	param := chi.URLParam(r, "empresaID")
	if param == "" {
		ResponderError(w, http.StatusBadRequest, "empresa_requerida")
		return
	}
	empresaID, ok := rt.resolverEmpresaPublica(w, r, param)
	if !ok {
		return
	}
	lista, err := rt.repoSucursales.ListarActivas(r.Context(), empresaID)
	if err != nil {
		ResponderError(w, http.StatusInternalServerError, "error_interno")
		return
	}
	if lista == nil {
		lista = []sedes.Sucursal{}
	}
	ResponderOK(w, lista)
}

// manejarSlotsPublico reutiliza la misma lógica que manejarConsultarSlots.
// No requiere autenticación: barberoID, servicioID y fecha vienen en query params.
func (rt *Rutas) manejarSlotsPublico(w http.ResponseWriter, r *http.Request) {
	rt.manejarConsultarSlots(w, r)
}

func (rt *Rutas) manejarCrearReservaPublica(w http.ResponseWriter, r *http.Request) {
	var solicitud struct {
		EmpresaID       string `json:"empresa_id"`
		SucursalID      string `json:"sucursal_id"`
		BarberoID       string `json:"barbero_id"`
		ServicioID      string `json:"servicio_id"`
		FechaHoraInicio string `json:"fecha_hora_inicio"`
		ClienteNombre   string `json:"cliente_nombre"`
		ClienteTelefono string `json:"cliente_telefono"`
		ClienteCorreo   string `json:"cliente_correo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&solicitud); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	if solicitud.EmpresaID == "" || solicitud.SucursalID == "" || solicitud.BarberoID == "" ||
		solicitud.ServicioID == "" || solicitud.FechaHoraInicio == "" ||
		solicitud.ClienteNombre == "" || solicitud.ClienteTelefono == "" {
		ResponderError(w, http.StatusBadRequest, "campos_requeridos")
		return
	}

	// Resolver slug → UUID si es necesario
	if empresaUUID, ok := rt.resolverEmpresaPublica(w, r, solicitud.EmpresaID); ok {
		solicitud.EmpresaID = empresaUUID
	} else {
		return
	}

	// 1. Registrar o encontrar el cliente por teléfono
	respCliente, err := rt.registrarCliente.Ejecutar(r.Context(), casoReservas.SolicitudRegistrarCliente{
		EmpresaID:         solicitud.EmpresaID,
		Nombre:            solicitud.ClienteNombre,
		Telefono:          solicitud.ClienteTelefono,
		CorreoElectronico: solicitud.ClienteCorreo,
		CreadoPor:         "", // reserva pública: sin usuario del sistema (creado_por = NULL)
	})
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}

	// 2. Crear la reserva con origen web_publica
	resp, err := rt.registrarReserva.Ejecutar(r.Context(), casoReservas.SolicitudRegistrarReserva{
		EmpresaID:       solicitud.EmpresaID,
		SucursalID:      solicitud.SucursalID,
		ClienteID:       respCliente.ClienteID,
		BarberoID:       solicitud.BarberoID,
		ServicioID:      solicitud.ServicioID,
		FechaHoraInicio: solicitud.FechaHoraInicio,
		Origen:          "WEB", // CHECK chk_reserva_origen: WHATSAPP|WEB|MANUAL
		CreadoPor:       "",    // reserva pública: creado_por = NULL (sin usuario del sistema)
	})
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}

	ResponderCreado(w, resp)
}

// ── Tablero ──────────────────────────────────────────────────────────────────

func (rt *Rutas) manejarObtenerMetricasTablero(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_requerida")
		return
	}

	nombreRol, _ := rt.repoAlcance.ObtenerNombreRol(r.Context(), sesion.UsuarioID, sesion.EmpresaID)

	q := r.URL.Query()
	resp, err := rt.obtenerMetricasTablero.Ejecutar(r.Context(), casoTablero.SolicitudObtenerMetricas{
		EmpresaID:   sesion.EmpresaID,
		FechaInicio: q.Get("inicio"),
		FechaFin:    q.Get("fin"),
		SucursalID:  q.Get("sucursal_id"),
		Rol:         nombreRol,
	})
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}

	ResponderOK(w, resp)
}

// ── Plataforma SUPERADMIN ─────────────────────────────────────────────────────

func (rt *Rutas) manejarListarEmpresasPlataforma(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_requerida")
		return
	}
	if !rt.exigirSuperAdmin(w, r, sesion) {
		return
	}

	resp, err := rt.listarEmpresasPlataforma.Ejecutar(r.Context())
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderOK(w, resp)
}

func (rt *Rutas) manejarOnboardearEmpresa(w http.ResponseWriter, r *http.Request) {
	sesion, ok := identidad.SesionDesdeContexto(r.Context())
	if !ok {
		ResponderError(w, http.StatusUnauthorized, "sesion_requerida")
		return
	}
	if !rt.exigirSuperAdmin(w, r, sesion) {
		return
	}

	var s casoOrg.SolicitudOnboardearEmpresa
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		ResponderError(w, http.StatusBadRequest, "solicitud_invalida")
		return
	}
	s.CreadoPor = sesion.UsuarioID

	resp, err := rt.onboardearEmpresa.Ejecutar(r.Context(), s)
	if err != nil {
		ResponderErrorDominio(w, err)
		return
	}
	ResponderCreado(w, resp)
}
