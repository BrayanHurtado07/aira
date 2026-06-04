package main

import (
	"context"
	"log"

	entradaHTTP "aira/aplicacion/entrada/http"
	contratosAgenda "aira/capacidades/agenda/contratos"
	casoAgenda "aira/capacidades/agenda/casos_uso"
	casoCanal "aira/capacidades/canal_whatsapp/casos_uso"
	"aira/plataforma/correo"
	casoGobierno "aira/capacidades/gobierno_acceso/casos_uso"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	contratosIdentidad "aira/capacidades/identidad/contratos"
	casoIdentidad "aira/capacidades/identidad/casos_uso"
	casoInventario "aira/capacidades/inventario/casos_uso"
	casoLealtad "aira/capacidades/lealtad/casos_uso"
	casoMonetizacion "aira/capacidades/monetizacion/casos_uso"
	casoNotificaciones "aira/capacidades/notificaciones/casos_uso"
	contratosOrg "aira/capacidades/organizacion/contratos"
	casoOrg "aira/capacidades/organizacion/casos_uso"
	contratosReservas "aira/capacidades/reservas/contratos"
	casoReservas "aira/capacidades/reservas/casos_uso"
	casoTablero "aira/capacidades/tablero/casos_uso"
	"aira/compartido/eventos"
	"aira/persistencia/cockroach"
	"aira/plataforma/gobierno/auditoria"
)

func main() {
	ctx := context.Background()

	pool, err := cockroach.NuevaConexion(ctx)
	if err != nil {
		log.Fatalf("no se pudo conectar a CockroachDB: %v", err)
	}
	defer pool.Close()

	// Infraestructura
	aud := auditoria.NuevoAuditorDB(pool)
	publicador := eventos.NuevoPublicadorLog()
	notificadorCorreo := correo.NuevoNotificadorCorreoLog()

	// ── Repositorios ─────────────────────────────────────────────────────────

	// Identidad
	repoUsuario := cockroach.NuevoRepositorioUsuario(pool)
	repoSesion := cockroach.NuevoRepositorioSesion(pool)

	// Organización
	repoEmpresa := cockroach.NuevoRepositorioEmpresa(pool)
	repoSucursal := cockroach.NuevoRepositorioSucursal(pool)
	repoPeriodo := cockroach.NuevoRepositorioPeriodo(pool)

	// Gobierno de Acceso
	repoAlcance := cockroach.NuevoRepositorioAlcance(pool)

	// Agenda
	repoBarbero := cockroach.NuevoRepositorioBarbero(pool)
	repoServicio := cockroach.NuevoRepositorioServicio(pool)
	repoDisponibilidad := cockroach.NuevoRepositorioDisponibilidad(pool)
	repoExcepcionDisponibilidad := cockroach.NuevoRepositorioExcepcionDisponibilidad(pool)

	// Reservas
	repoCliente := cockroach.NuevoRepositorioCliente(pool)
	repoReserva := cockroach.NuevoRepositorioReserva(pool)

	// Canal WhatsApp
	repoConversacion := cockroach.NuevoRepositorioConversacion(pool)
	repoMensaje := cockroach.NuevoRepositorioMensaje(pool)
	repoSesionChat := cockroach.NuevoRepositorioSesionChat(pool)

	// Monetización
	repoSuscripcion := cockroach.NuevoRepositorioSuscripcion(pool)

	// Verificaciones
	repoVerificacion := cockroach.NuevoRepositorioVerificacion(pool)

	// Lealtad
	repoSello := cockroach.NuevoRepositorioSello(pool)

	// Notificaciones
	repoRecordatorio := cockroach.NuevoRepositorioRecordatorio(pool)
	repoPlantilla := cockroach.NuevoRepositorioPlantilla(pool)

	// Inventario
	repoProducto := cockroach.NuevoRepositorioProducto(pool)
	repoMovimientoInventario := cockroach.NuevoRepositorioMovimientoInventario(pool)

	// Reservas — complementos y lista de espera
	repoComplementoReserva := cockroach.NuevoRepositorioComplementoReserva(pool)
	repoListaEspera := cockroach.NuevoRepositorioListaEspera(pool)

	// Agenda — tarifas
	repoTarifaEspecial := cockroach.NuevoRepositorioTarifaEspecial(pool)

	// ── Adaptadores de contrato (Fase 9) ─────────────────────────────────────

	verificadorIdentidad := contratosIdentidad.NuevoVerificadorIdentidad(repoUsuario)
	consultorSede := contratosOrg.NuevoConsultorSede(repoSucursal, repoPeriodo)
	gestorDisponibilidad := contratosAgenda.NuevoGestorDisponibilidad(repoDisponibilidad)
	consultorDisponibilidad := contratosAgenda.NuevoConsultorDisponibilidad(repoDisponibilidad)

	// ── Contratos de Fase 11 — Seguridad ─────────────────────────────────────

	validadorPermiso := contratosGobierno.NuevoValidadorPermiso(repoAlcance)
	validadorContexto := contratosOrg.NuevoValidadorContextoCoherente(repoSucursal, repoPeriodo)

	// ── Casos de uso ─────────────────────────────────────────────────────────

	// Identidad
	cuRegistrarUsuario := casoIdentidad.NuevoCasoUsoRegistrarUsuario(repoUsuario, publicador, aud)
	cuIniciarSesion := casoIdentidad.NuevoCasoUsoIniciarSesionGlobal(repoUsuario, repoSesion, repoAlcance, publicador, aud)
	cuCerrarSesion := casoIdentidad.NuevoCasoUsoCerrarSesion(repoSesion, publicador, aud)
	cuInactivarUsuario := casoIdentidad.NuevoCasoUsoInactivarUsuario(repoUsuario, repoSesion, validadorPermiso, publicador, aud)
	cuCambiarPassword := casoIdentidad.NuevoCasoUsoCambiarPassword(repoUsuario, repoSesion, publicador, aud)
	cuSolicitarVerificacionCorreo := casoIdentidad.NuevoCasoUsoSolicitarVerificacionCorreo(repoUsuario, repoVerificacion, notificadorCorreo, aud)
	cuVerificarCorreo := casoIdentidad.NuevoCasoUsoVerificarCorreo(repoVerificacion, publicador, aud)
	cuSolicitarRestablecimientoPassword := casoIdentidad.NuevoCasoUsoSolicitarRestablecimientoPassword(repoUsuario, repoVerificacion, notificadorCorreo, aud)
	cuRestablecerPassword := casoIdentidad.NuevoCasoUsoRestablecerPassword(repoUsuario, repoVerificacion, publicador, aud)

	// Organización
	cuCrearEmpresa := casoOrg.NuevoCasoUsoCrearEmpresa(repoEmpresa, publicador, aud)
	cuCrearSucursal := casoOrg.NuevoCasoUsoCrearSucursal(repoEmpresa, repoSucursal, validadorPermiso, publicador, aud)
	cuActualizarEstadoSucursal := casoOrg.NuevoCasoUsoActualizarEstadoSucursal(repoSucursal, validadorPermiso, publicador, aud)
	cuCrearPeriodo := casoOrg.NuevoCasoUsoCrearPeriodo(repoEmpresa, repoPeriodo, validadorPermiso, publicador, aud)
	cuCerrarPeriodo := casoOrg.NuevoCasoUsoCerrarPeriodo(repoPeriodo, validadorPermiso, publicador, aud)
	cuGuardarConfiguracion := casoOrg.NuevoCasoUsoGuardarConfiguracionEmpresa(repoEmpresa, validadorPermiso, publicador, aud)

	// Gobierno de Acceso
	cuAsignarAlcance := casoGobierno.NuevoCasoUsoAsignarAlcance(repoAlcance, validadorPermiso, verificadorIdentidad, validadorContexto, publicador, aud)
	cuRevocarAlcance := casoGobierno.NuevoCasoUsoRevocarAlcance(repoAlcance, validadorPermiso, publicador, aud)

	// Agenda
	cuRegistrarBarbero := casoAgenda.NuevoCasoUsoRegistrarBarbero(repoEmpresa, repoBarbero, verificadorIdentidad, validadorPermiso, publicador, aud)
	cuActualizarBarbero := casoAgenda.NuevoCasoUsoActualizarBarbero(repoBarbero, validadorPermiso, publicador, aud)
	cuActualizarEstadoBarbero := casoAgenda.NuevoCasoUsoActualizarEstadoBarbero(repoBarbero, validadorPermiso, publicador, aud)
	cuDesasignarServicio := casoAgenda.NuevoCasoUsoDesasignarServicioBarbero(repoBarbero, validadorPermiso, publicador, aud)
	cuCrearServicio := casoAgenda.NuevoCasoUsoCrearServicio(repoEmpresa, repoServicio, validadorPermiso, publicador, aud)
	cuActualizarServicio := casoAgenda.NuevoCasoUsoActualizarServicio(repoServicio, validadorPermiso, publicador, aud)
	cuActualizarEstadoServicio := casoAgenda.NuevoCasoUsoActualizarEstadoServicio(repoServicio, validadorPermiso, publicador, aud)
	cuRegistrarDisponibilidad := casoAgenda.NuevoCasoUsoRegistrarDisponibilidad(repoDisponibilidad, validadorPermiso, publicador, aud)
	cuAsignarServicioBarbero := casoAgenda.NuevoCasoUsoAsignarServicioBarbero(repoBarbero, repoServicio, aud)
	cuRegistrarExcepcionDisponibilidad := casoAgenda.NuevoCasoUsoRegistrarExcepcionDisponibilidad(repoExcepcionDisponibilidad, validadorPermiso, publicador, aud)

	// Reservas
	cuRegistrarCliente := casoReservas.NuevoCasoUsoRegistrarCliente(repoCliente, aud)
	cuActualizarCliente := casoReservas.NuevoCasoUsoActualizarCliente(repoCliente, validadorPermiso, publicador, aud)
	cuActualizarEstadoCliente := casoReservas.NuevoCasoUsoActualizarEstadoCliente(repoCliente, validadorPermiso, publicador, aud)
	cuRegistrarReserva := casoReservas.NuevoCasoUsoRegistrarReserva(repoReserva, gestorDisponibilidad, publicador, aud)
	cuActualizarReserva := casoReservas.NuevoCasoUsoActualizarReserva(repoReserva, validadorPermiso, publicador, aud)
	cuConfirmarReserva := casoReservas.NuevoCasoUsoConfirmarReserva(repoReserva, validadorPermiso, publicador, aud)
	cuCancelarReserva := casoReservas.NuevoCasoUsoCancelarReserva(repoReserva, gestorDisponibilidad, validadorPermiso, publicador, aud)
	cuCompletarReserva := casoReservas.NuevoCasoUsoCompletarReserva(repoReserva, validadorPermiso, publicador, aud)

	// Reservas — adaptador CreadorReserva para Canal WhatsApp
	creadorReserva := contratosReservas.NuevoCreadorReserva(cuRegistrarReserva, cuCancelarReserva)

	// Canal WhatsApp
	cuIniciarConversacion := casoCanal.NuevoCasoUsoIniciarConversacion(repoConversacion, publicador, aud)
	cuRegistrarMensaje := casoCanal.NuevoCasoUsoRegistrarMensaje(repoConversacion, repoMensaje)
	cuGestionarSesionChat := casoCanal.NuevoCasoUsoGestionarSesionChat(repoSesionChat)
	cuAtenderChat := casoCanal.NuevoCasoUsoAtenderChat(creadorReserva, consultorDisponibilidad, consultorSede)

	// Monetización
	cuActivarSuscripcion := casoMonetizacion.NuevoCasoUsoActivarSuscripcion(repoSuscripcion, aud)
	cuSuspenderSuscripcion := casoMonetizacion.NuevoCasoUsoSuspenderSuscripcion(repoSuscripcion, aud)
	cuCancelarSuscripcion := casoMonetizacion.NuevoCasoUsoCancelarSuscripcion(repoSuscripcion, aud)

	// Lealtad
	cuCrearProgramaLealtad := casoLealtad.NuevoCasoUsoCrearProgramaLealtad(repoSello, validadorPermiso, publicador, aud)
	cuAcumularSello := casoLealtad.NuevoCasoUsoAcumularSello(repoSello, aud)
	cuAnularSello := casoLealtad.NuevoCasoUsoAnularSello(repoSello, aud)
	cuAplicarCanje := casoLealtad.NuevoCasoUsoAplicarCanje(repoSello, aud)

	// Notificaciones
	cuProgramarRecordatorio := casoNotificaciones.NuevoCasoUsoProgramarRecordatorio(repoRecordatorio, aud)
	cuCancelarRecordatorio := casoNotificaciones.NuevoCasoUsoCancelarRecordatorio(repoRecordatorio, aud)
	cuCrearPlantilla := casoNotificaciones.NuevoCasoUsoCrearPlantilla(repoPlantilla, validadorPermiso, publicador, aud)

	// Inventario
	cuCrearProducto := casoInventario.NuevoCasoUsoCrearProducto(repoProducto, validadorPermiso, publicador, aud)
	cuRegistrarMovimientoInventario := casoInventario.NuevoCasoUsoRegistrarMovimientoInventario(repoMovimientoInventario, validadorPermiso, publicador, aud)

	// Reservas — complementos y lista de espera
	cuAgregarComplementoReserva := casoReservas.NuevoCasoUsoAgregarComplementoReserva(repoComplementoReserva, publicador, aud)
	cuIngresarListaEspera := casoReservas.NuevoCasoUsoIngresarListaEspera(repoListaEspera, publicador, aud)

	// Agenda — tarifas
	cuCrearTarifaEspecial := casoAgenda.NuevoCasoUsoCrearTarifaEspecial(repoTarifaEspecial, validadorPermiso, publicador, aud)

	// Identidad — refresh
	cuRefrescarSesion := casoIdentidad.NuevoCasoUsoRefrescarSesion(repoSesion, publicador, aud)

	// Tablero
	repoTablero := cockroach.NuevoRepositorioTablero(pool)
	cuObtenerMetricasTablero := casoTablero.NuevoCasoUsoObtenerMetricasTablero(repoTablero)

	// ── Servidor HTTP ─────────────────────────────────────────────────────────
	srv := entradaHTTP.NuevoServidor(pool, aud)
	if err := srv.Iniciar(
		// Identidad
		cuRegistrarUsuario,
		cuIniciarSesion,
		cuCerrarSesion,
		cuInactivarUsuario,
		cuCambiarPassword,
		cuSolicitarVerificacionCorreo,
		cuVerificarCorreo,
		cuSolicitarRestablecimientoPassword,
		cuRestablecerPassword,
		// Organización
		cuCrearEmpresa,
		cuCrearSucursal,
		cuActualizarEstadoSucursal,
		cuCrearPeriodo,
		cuCerrarPeriodo,
		cuGuardarConfiguracion,
		// Gobierno de Acceso
		cuAsignarAlcance,
		cuRevocarAlcance,
		// Agenda
		cuRegistrarBarbero,
		cuActualizarBarbero,
		cuActualizarEstadoBarbero,
		cuDesasignarServicio,
		cuCrearServicio,
		cuActualizarServicio,
		cuActualizarEstadoServicio,
		cuRegistrarDisponibilidad,
		cuAsignarServicioBarbero,
		cuRegistrarExcepcionDisponibilidad,
		// Reservas
		cuRegistrarCliente,
		cuActualizarCliente,
		cuActualizarEstadoCliente,
		cuRegistrarReserva,
		cuActualizarReserva,
		cuConfirmarReserva,
		cuCancelarReserva,
		cuCompletarReserva,
		// Canal WhatsApp
		cuIniciarConversacion,
		cuRegistrarMensaje,
		cuGestionarSesionChat,
		cuAtenderChat,
		// Monetización
		cuActivarSuscripcion,
		cuSuspenderSuscripcion,
		cuCancelarSuscripcion,
		// Lealtad
		cuCrearProgramaLealtad,
		cuAcumularSello,
		cuAnularSello,
		cuAplicarCanje,
		// Notificaciones
		cuProgramarRecordatorio,
		cuCancelarRecordatorio,
		cuCrearPlantilla,
		// Inventario
		cuCrearProducto,
		cuRegistrarMovimientoInventario,
		// Reservas — complementos y lista de espera
		cuAgregarComplementoReserva,
		cuIngresarListaEspera,
		// Agenda — tarifas
		cuCrearTarifaEspecial,
		// Identidad — refresh
		cuRefrescarSesion,
		// Tablero
		cuObtenerMetricasTablero,
		// Infraestructura
		repoSesion,
	); err != nil {
		log.Fatalf("servidor: %v", err)
	}
}
