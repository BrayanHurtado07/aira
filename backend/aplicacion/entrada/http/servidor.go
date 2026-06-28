package http

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"aira/aplicacion/orquestacion"
	casoAgenda "aira/capacidades/agenda/casos_uso"
	casoCampanias "aira/capacidades/campanias/casos_uso"
	casoCanal "aira/capacidades/canal_whatsapp/casos_uso"
	casoComisiones "aira/capacidades/comisiones/casos_uso"
	casoGobierno "aira/capacidades/gobierno_acceso/casos_uso"
	casoIdentidad "aira/capacidades/identidad/casos_uso"
	"aira/capacidades/identidad/sesiones"
	casoIntegraciones "aira/capacidades/integraciones/casos_uso"
	casoInventario "aira/capacidades/inventario/casos_uso"
	casoLealtad "aira/capacidades/lealtad/casos_uso"
	casoMonetizacion "aira/capacidades/monetizacion/casos_uso"
	casoNotificaciones "aira/capacidades/notificaciones/casos_uso"
	casoOrg "aira/capacidades/organizacion/casos_uso"
	casoReputacion "aira/capacidades/reputacion/casos_uso"
	casoReservas "aira/capacidades/reservas/casos_uso"
	casoTablero "aira/capacidades/tablero/casos_uso"
	repoCockroach "aira/persistencia/cockroach"
	"aira/plataforma/gobierno/auditoria"
	pagosPlataforma "aira/plataforma/pagos"
	"aira/plataforma/whatsapp"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Servidor struct {
	pool *pgxpool.Pool
	aud  auditoria.Auditoria
}

func NuevoServidor(pool *pgxpool.Pool, aud auditoria.Auditoria) *Servidor {
	return &Servidor{pool: pool, aud: aud}
}

func (s *Servidor) Iniciar(
	// Identidad
	registrarUsuario *casoIdentidad.CasoUsoRegistrarUsuario,
	iniciarSesion *casoIdentidad.CasoUsoIniciarSesionGlobal,
	cerrarSesion *casoIdentidad.CasoUsoCerrarSesion,
	inactivarUsuario *casoIdentidad.CasoUsoInactivarUsuario,
	cambiarPassword *casoIdentidad.CasoUsoCambiarPassword,
	solicitarVerificacionCorreo *casoIdentidad.CasoUsoSolicitarVerificacionCorreo,
	verificarCorreo *casoIdentidad.CasoUsoVerificarCorreo,
	solicitarRestablecimientoPassword *casoIdentidad.CasoUsoSolicitarRestablecimientoPassword,
	restablecerPassword *casoIdentidad.CasoUsoRestablecerPassword,
	// Organización
	crearEmpresa *casoOrg.CasoUsoCrearEmpresa,
	crearSucursal *casoOrg.CasoUsoCrearSucursal,
	actualizarEstadoSucursal *casoOrg.CasoUsoActualizarEstadoSucursal,
	crearPeriodo *casoOrg.CasoUsoCrearPeriodo,
	cerrarPeriodo *casoOrg.CasoUsoCerrarPeriodo,
	guardarConfiguracion *casoOrg.CasoUsoGuardarConfiguracionEmpresa,
	// Gobierno de Acceso
	asignarAlcance *casoGobierno.CasoUsoAsignarAlcance,
	revocarAlcance *casoGobierno.CasoUsoRevocarAlcance,
	// Agenda
	registrarBarbero *casoAgenda.CasoUsoRegistrarBarbero,
	actualizarBarbero *casoAgenda.CasoUsoActualizarBarbero,
	actualizarEstadoBarbero *casoAgenda.CasoUsoActualizarEstadoBarbero,
	desasignarServicio *casoAgenda.CasoUsoDesasignarServicioBarbero,
	crearServicio *casoAgenda.CasoUsoCrearServicio,
	actualizarServicio *casoAgenda.CasoUsoActualizarServicio,
	actualizarEstadoServicio *casoAgenda.CasoUsoActualizarEstadoServicio,
	registrarDisponibilidad *casoAgenda.CasoUsoRegistrarDisponibilidad,
	asignarServicioBarbero *casoAgenda.CasoUsoAsignarServicioBarbero,
	registrarExcepcionDisponibilidad *casoAgenda.CasoUsoRegistrarExcepcionDisponibilidad,
	// Reservas
	registrarCliente *casoReservas.CasoUsoRegistrarCliente,
	actualizarCliente *casoReservas.CasoUsoActualizarCliente,
	actualizarEstadoCliente *casoReservas.CasoUsoActualizarEstadoCliente,
	registrarReserva *casoReservas.CasoUsoRegistrarReserva,
	actualizarReserva *casoReservas.CasoUsoActualizarReserva,
	confirmarReserva *casoReservas.CasoUsoConfirmarReserva,
	cancelarReserva *casoReservas.CasoUsoCancelarReserva,
	completarReserva *casoReservas.CasoUsoCompletarReserva,
	marcarNoAsistio *casoReservas.CasoUsoMarcarNoAsistio,
	// Canal WhatsApp
	iniciarConversacion *casoCanal.CasoUsoIniciarConversacion,
	registrarMensaje *casoCanal.CasoUsoRegistrarMensaje,
	gestionarSesionChat *casoCanal.CasoUsoGestionarSesionChat,
	atenderChat *casoCanal.CasoUsoAtenderChat,
	// Monetización
	activarSuscripcion *casoMonetizacion.CasoUsoActivarSuscripcion,
	suspenderSuscripcion *casoMonetizacion.CasoUsoSuspenderSuscripcion,
	cancelarSuscripcion *casoMonetizacion.CasoUsoCancelarSuscripcion,
	// Lealtad
	crearProgramaLealtad *casoLealtad.CasoUsoCrearProgramaLealtad,
	acumularSello *casoLealtad.CasoUsoAcumularSello,
	anularSello *casoLealtad.CasoUsoAnularSello,
	aplicarCanje *casoLealtad.CasoUsoAplicarCanje,
	// Notificaciones
	programarRecordatorio *casoNotificaciones.CasoUsoProgramarRecordatorio,
	cancelarRecordatorio *casoNotificaciones.CasoUsoCancelarRecordatorio,
	crearPlantilla *casoNotificaciones.CasoUsoCrearPlantilla,
	// Inventario
	crearProducto *casoInventario.CasoUsoCrearProducto,
	registrarMovimientoInventario *casoInventario.CasoUsoRegistrarMovimientoInventario,
	// Reservas — complementos y lista de espera
	agregarComplementoReserva *casoReservas.CasoUsoAgregarComplementoReserva,
	ingresarListaEspera *casoReservas.CasoUsoIngresarListaEspera,
	promoverListaEspera *casoReservas.CasoUsoPromoverListaEspera,
	// Agenda — tarifas
	crearTarifaEspecial *casoAgenda.CasoUsoCrearTarifaEspecial,
	// Identidad — refresh
	refrescarSesion *casoIdentidad.CasoUsoRefrescarSesion,
	// Tablero
	obtenerMetricasTablero *casoTablero.CasoUsoObtenerMetricasTablero,
	crearEsquemaComision *casoComisiones.CasoUsoCrearEsquemaComision,
	generarComision *casoComisiones.CasoUsoGenerarComision,
	calcularLiquidacion *casoComisiones.CasoUsoCalcularLiquidacion,
	aprobarLiquidacion *casoComisiones.CasoUsoAprobarLiquidacion,
	pagarLiquidacion *casoComisiones.CasoUsoPagarLiquidacion,
	registrarResena *casoReputacion.CasoUsoRegistrarResena,
	actualizarEstadoResena *casoReputacion.CasoUsoActualizarEstadoResena,
	conectarGoogle *casoIntegraciones.CasoUsoConectarGoogleCalendar,
	desconectarGoogle *casoIntegraciones.CasoUsoDesconectarGoogleCalendar,
	sincronizarReserva *casoIntegraciones.CasoUsoSincronizarReserva,
	crearCampana *casoCampanias.CasoUsoCrearCampana,
	cargarInactivos *casoCampanias.CasoUsoCargarInactivos,
	despacharCampana *casoCampanias.CasoUsoDespacharCampana,
	conversarAira *casoCanal.CasoUsoConversarAira,
	// Plataforma SUPERADMIN
	onboardearEmpresa *casoOrg.CasoUsoOnboardearEmpresa,
	listarEmpresasPlataforma *casoOrg.CasoUsoListarEmpresasPlataforma,
	// Infraestructura
	repoSesiones sesiones.RepositorioSesion,
) error {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	mw := NuevoMiddlewareAutenticacion(repoSesiones)

	// Repositorio de alcance compartido entre guardia y listados
	repoAlcanceSrv := repoCockroach.NuevoRepositorioAlcance(s.pool)
	guardia := orquestacion.NuevaGuardiaPoliticas(repoAlcanceSrv)

	rutas := &Rutas{
		// Identidad
		registrarUsuario:                  registrarUsuario,
		iniciarSesion:                     iniciarSesion,
		cerrarSesion:                      cerrarSesion,
		inactivarUsuario:                  inactivarUsuario,
		cambiarPassword:                   cambiarPassword,
		solicitarVerificacionCorreo:       solicitarVerificacionCorreo,
		verificarCorreo:                   verificarCorreo,
		solicitarRestablecimientoPassword: solicitarRestablecimientoPassword,
		restablecerPassword:               restablecerPassword,
		// Organización
		crearEmpresa:             crearEmpresa,
		crearSucursal:            crearSucursal,
		actualizarEstadoSucursal: actualizarEstadoSucursal,
		crearPeriodo:             crearPeriodo,
		cerrarPeriodo:            cerrarPeriodo,
		guardarConfiguracion:     guardarConfiguracion,
		// Gobierno de Acceso
		asignarAlcance: asignarAlcance,
		revocarAlcance: revocarAlcance,
		// Agenda
		registrarBarbero:                 registrarBarbero,
		actualizarBarbero:                actualizarBarbero,
		actualizarEstadoBarbero:          actualizarEstadoBarbero,
		desasignarServicio:               desasignarServicio,
		crearServicio:                    crearServicio,
		actualizarServicio:               actualizarServicio,
		actualizarEstadoServicio:         actualizarEstadoServicio,
		registrarDisponibilidad:          registrarDisponibilidad,
		asignarServicioBarbero:           asignarServicioBarbero,
		registrarExcepcionDisponibilidad: registrarExcepcionDisponibilidad,
		// Reservas
		registrarCliente:        registrarCliente,
		actualizarCliente:       actualizarCliente,
		actualizarEstadoCliente: actualizarEstadoCliente,
		registrarReserva:        registrarReserva,
		actualizarReserva:       actualizarReserva,
		confirmarReserva:        confirmarReserva,
		cancelarReserva:         cancelarReserva,
		completarReserva:        completarReserva,
		marcarNoAsistio:         marcarNoAsistio,
		// Canal WhatsApp
		iniciarConversacion: iniciarConversacion,
		registrarMensaje:    registrarMensaje,
		gestionarSesionChat: gestionarSesionChat,
		atenderChat:         atenderChat,
		// Monetización
		activarSuscripcion:   activarSuscripcion,
		suspenderSuscripcion: suspenderSuscripcion,
		cancelarSuscripcion:  cancelarSuscripcion,
		// Lealtad
		crearProgramaLealtad: crearProgramaLealtad,
		acumularSello:        acumularSello,
		anularSello:          anularSello,
		aplicarCanje:         aplicarCanje,
		// Notificaciones
		programarRecordatorio: programarRecordatorio,
		cancelarRecordatorio:  cancelarRecordatorio,
		crearPlantilla:        crearPlantilla,
		// Inventario
		crearProducto:                 crearProducto,
		registrarMovimientoInventario: registrarMovimientoInventario,
		// Reservas — complementos y lista de espera
		agregarComplementoReserva: agregarComplementoReserva,
		ingresarListaEspera:       ingresarListaEspera,
		promoverListaEspera:       promoverListaEspera,
		// Agenda — tarifas
		crearTarifaEspecial: crearTarifaEspecial,
		// Identidad — refresh
		refrescarSesion: refrescarSesion,
		// Tablero
		obtenerMetricasTablero: obtenerMetricasTablero,
		crearEsquemaComision:   crearEsquemaComision,
		generarComision:        generarComision,
		calcularLiquidacion:    calcularLiquidacion,
		aprobarLiquidacion:     aprobarLiquidacion,
		pagarLiquidacion:       pagarLiquidacion,
		repoComision:           repoCockroach.NuevoRepositorioComision(s.pool),
		registrarResena:        registrarResena,
		actualizarEstadoResena: actualizarEstadoResena,
		repoReputacion:         repoCockroach.NuevoRepositorioReputacion(s.pool),
		conectarGoogle:         conectarGoogle,
		desconectarGoogle:      desconectarGoogle,
		sincronizarReserva:     sincronizarReserva,
		repoIntegracion:        repoCockroach.NuevoRepositorioIntegracion(s.pool),
		crearCampana:           crearCampana,
		cargarInactivos:        cargarInactivos,
		despacharCampana:       despacharCampana,
		repoCampana:            repoCockroach.NuevoRepositorioCampana(s.pool),
		conversarAira:          conversarAira,
		recibirWebhookWA: casoCanal.NuevoCasoUsoRecibirWebhookWhatsApp(
			repoCockroach.NuevoRepositorioSesionWhatsApp(s.pool),
			conversarAira,
			whatsapp.NuevoDespachadorChatMeta(repoCockroach.NuevoRepositorioSesionWhatsApp(s.pool), os.Getenv("WA_CIFRADO_CLAVE")),
		),
		repoConversacionWA: repoCockroach.NuevoRepositorioConversacion(s.pool),
		repoMensajeWA:      repoCockroach.NuevoRepositorioMensaje(s.pool),
		repoSesionChatWA:   repoCockroach.NuevoRepositorioSesionChat(s.pool),
		cobrarSuscripcion: casoMonetizacion.NuevoCasoUsoCobrarSuscripcion(
			repoCockroach.NuevoRepositorioPago(s.pool),
			pagosPlataforma.NuevaPasarela(),
			s.aud,
		),
		// Plataforma SUPERADMIN
		onboardearEmpresa:        onboardearEmpresa,
		listarEmpresasPlataforma: listarEmpresasPlataforma,
		// Repositorios de listado
		repoEmpresa:                 repoCockroach.NuevoRepositorioEmpresa(s.pool),
		repoBarberos:                repoCockroach.NuevoRepositorioBarbero(s.pool),
		repoServicios:               repoCockroach.NuevoRepositorioServicio(s.pool),
		repoReservas:                repoCockroach.NuevoRepositorioReserva(s.pool),
		repoClientes:                repoCockroach.NuevoRepositorioCliente(s.pool),
		repoSucursales:              repoCockroach.NuevoRepositorioSucursal(s.pool),
		repoPeriodo:                 repoCockroach.NuevoRepositorioPeriodo(s.pool),
		repoDisponibilidad:          repoCockroach.NuevoRepositorioDisponibilidad(s.pool),
		repoExcepcionDisponibilidad: repoCockroach.NuevoRepositorioExcepcionDisponibilidad(s.pool),
		repoTarifas:                 repoCockroach.NuevoRepositorioTarifaEspecial(s.pool),
		repoProductos:               repoCockroach.NuevoRepositorioProducto(s.pool),
		repoMovimientoInventario:    repoCockroach.NuevoRepositorioMovimientoInventario(s.pool),
		repoListaEspera:             repoCockroach.NuevoRepositorioListaEspera(s.pool),
		repoComplementoReserva:      repoCockroach.NuevoRepositorioComplementoReserva(s.pool),
		repoPlantillas:              repoCockroach.NuevoRepositorioPlantilla(s.pool),
		repoSello:                   repoCockroach.NuevoRepositorioSello(s.pool),
		repoRecordatorio:            repoCockroach.NuevoRepositorioRecordatorio(s.pool),
		repoAlcance:                 repoAlcanceSrv,
		repoSuscripcion:             repoCockroach.NuevoRepositorioSuscripcion(s.pool),
		repoPlan:                    repoCockroach.NuevoRepositorioPlan(s.pool),
		repoIdentidad:               repoCockroach.NuevoRepositorioUsuario(s.pool),
		// Seguridad
		guardia:    guardia,
		middleware: mw,
	}

	rutas.Montar(r)

	puerto := os.Getenv("PORT")
	if puerto == "" {
		puerto = "8080"
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", puerto),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	idleConnsClosed := make(chan struct{})
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, syscall.SIGINT, syscall.SIGTERM)
		<-sigint

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("shutdown: %v", err)
		}
		close(idleConnsClosed)
	}()

	log.Printf("aira escuchando en :%s", puerto)
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		return fmt.Errorf("servidor: %w", err)
	}

	<-idleConnsClosed
	return nil
}
