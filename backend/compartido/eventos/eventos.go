package eventos

import (
	"time"

	"github.com/google/uuid"
)

// EventoDominio representa un hecho irreversible que ocurrió en el dominio.
// Se nombra siempre en pasado. No describe intención — describe consecuencia.
type EventoDominio struct {
	ID          string
	Tipo        string
	EntidadTipo string
	EntidadID   string
	UsuarioID   string
	ClienteID   string
	Datos       map[string]any
	OcurridoEn  time.Time
}

func nuevoID() string {
	return uuid.New().String()
}

// ── Identidad ────────────────────────────────────────────────────────────────

func UsuarioRegistrado(usuarioID, correo string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "usuario_registrado",
		EntidadTipo: "usuario",
		EntidadID:   usuarioID,
		UsuarioID:   usuarioID,
		Datos:       map[string]any{"correo": correo},
		OcurridoEn:  time.Now(),
	}
}

func UsuarioInactivado(usuarioID, inactivadoPor, empresaID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "usuario_inactivado",
		EntidadTipo: "usuario",
		EntidadID:   usuarioID,
		UsuarioID:   inactivadoPor,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

func PasswordCambiado(usuarioID, empresaID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "password_cambiado",
		EntidadTipo: "usuario",
		EntidadID:   usuarioID,
		UsuarioID:   usuarioID,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

func SesionesInvalidadasPorInactivacion(usuarioID string, cantidad int) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "sesiones_invalidadas_por_inactivacion",
		EntidadTipo: "usuario",
		EntidadID:   usuarioID,
		UsuarioID:   usuarioID,
		Datos:       map[string]any{"sesiones_invalidadas": cantidad},
		OcurridoEn:  time.Now(),
	}
}

func SesionesInvalidadasPorPassword(usuarioID string, cantidad int) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "sesiones_invalidadas_por_password",
		EntidadTipo: "usuario",
		EntidadID:   usuarioID,
		UsuarioID:   usuarioID,
		Datos:       map[string]any{"sesiones_invalidadas": cantidad},
		OcurridoEn:  time.Now(),
	}
}

// ── Identidad — Sesiones ─────────────────────────────────────────────────────

func SesionIniciada(sesionID, usuarioID, empresaID, dispositivo string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "sesion_iniciada",
		EntidadTipo: "sesion_global",
		EntidadID:   sesionID,
		UsuarioID:   usuarioID,
		Datos:       map[string]any{"empresa_id": empresaID, "dispositivo": dispositivo},
		OcurridoEn:  time.Now(),
	}
}

func SesionRevocada(sesionID, usuarioID, empresaID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "sesion_revocada",
		EntidadTipo: "sesion_global",
		EntidadID:   sesionID,
		UsuarioID:   usuarioID,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

// ── Organización ─────────────────────────────────────────────────────────────

func CorreoVerificado(usuarioID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "correo_verificado",
		EntidadTipo: "usuario",
		EntidadID:   usuarioID,
		UsuarioID:   usuarioID,
		OcurridoEn:  time.Now(),
	}
}

func PasswordRestablecido(usuarioID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "password_restablecido",
		EntidadTipo: "usuario",
		EntidadID:   usuarioID,
		UsuarioID:   usuarioID,
		OcurridoEn:  time.Now(),
	}
}

func BarberiaCreada(barberiaID, nombre, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "barberia_creada",
		EntidadTipo: "empresa",
		EntidadID:   barberiaID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"nombre": nombre},
		OcurridoEn:  time.Now(),
	}
}

func SedeCreada(sedeID, barberiaID, nombre, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "sede_creada",
		EntidadTipo: "sucursal",
		EntidadID:   sedeID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"barberia_id": barberiaID, "nombre": nombre},
		OcurridoEn:  time.Now(),
	}
}

func PeriodoAbierto(periodoID, barberiaID, nombre, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "periodo_abierto",
		EntidadTipo: "periodo",
		EntidadID:   periodoID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"barberia_id": barberiaID, "nombre": nombre},
		OcurridoEn:  time.Now(),
	}
}

func PeriodoCerrado(periodoID, barberiaID, cerradoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "periodo_cerrado",
		EntidadTipo: "periodo",
		EntidadID:   periodoID,
		UsuarioID:   cerradoPor,
		Datos:       map[string]any{"barberia_id": barberiaID},
		OcurridoEn:  time.Now(),
	}
}

// ── Gobierno de Acceso ───────────────────────────────────────────────────────

func AlcanceAsignado(alcanceID, usuarioID, barberiaID, rolID, asignadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "alcance_asignado",
		EntidadTipo: "alcance",
		EntidadID:   alcanceID,
		UsuarioID:   asignadoPor,
		Datos: map[string]any{
			"usuario_id":  usuarioID,
			"barberia_id": barberiaID,
			"rol_id":      rolID,
		},
		OcurridoEn: time.Now(),
	}
}

func AlcanceRevocado(alcanceID, revocadoPor, barberiaID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "alcance_revocado",
		EntidadTipo: "alcance",
		EntidadID:   alcanceID,
		UsuarioID:   revocadoPor,
		Datos:       map[string]any{"barberia_id": barberiaID},
		OcurridoEn:  time.Now(),
	}
}

// ── Agenda ───────────────────────────────────────────────────────────────────

func BarberoRegistrado(barberoID, barberiaID, nombre, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "barbero_registrado",
		EntidadTipo: "barbero",
		EntidadID:   barberoID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"barberia_id": barberiaID, "nombre": nombre},
		OcurridoEn:  time.Now(),
	}
}

func ServicioRegistrado(servicioID, barberiaID, nombre, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "servicio_registrado",
		EntidadTipo: "servicio",
		EntidadID:   servicioID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"barberia_id": barberiaID, "nombre": nombre},
		OcurridoEn:  time.Now(),
	}
}

func ExcepcionDisponibilidadRegistrada(excepcionID, barberoID, sucursalID, fecha, motivo, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "excepcion_disponibilidad_registrada",
		EntidadTipo: "excepcion_disponibilidad",
		EntidadID:   excepcionID,
		UsuarioID:   creadoPor,
		Datos: map[string]any{
			"barbero_id":  barberoID,
			"sucursal_id": sucursalID,
			"fecha":       fecha,
			"motivo":      motivo,
		},
		OcurridoEn: time.Now(),
	}
}

func DisponibilidadCreada(disponibilidadID, barberoID, sucursalID, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "disponibilidad_creada",
		EntidadTipo: "disponibilidad",
		EntidadID:   disponibilidadID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"barbero_id": barberoID, "sucursal_id": sucursalID},
		OcurridoEn:  time.Now(),
	}
}

func DisponibilidadMarcadaReservada(disponibilidadID, reservaID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "disponibilidad_marcada_reservada",
		EntidadTipo: "disponibilidad",
		EntidadID:   disponibilidadID,
		Datos:       map[string]any{"reserva_id": reservaID},
		OcurridoEn:  time.Now(),
	}
}

func DisponibilidadLiberada(disponibilidadID, reservaID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "disponibilidad_liberada",
		EntidadTipo: "disponibilidad",
		EntidadID:   disponibilidadID,
		Datos:       map[string]any{"reserva_id": reservaID},
		OcurridoEn:  time.Now(),
	}
}

// ── Reservas ─────────────────────────────────────────────────────────────────

func ReservaCreada(reservaID, clienteID, barberoID, sedeID, origen string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "reserva_creada",
		EntidadTipo: "reserva",
		EntidadID:   reservaID,
		ClienteID:   clienteID,
		Datos:       map[string]any{"barbero_id": barberoID, "sede_id": sedeID, "origen": origen},
		OcurridoEn:  time.Now(),
	}
}

func ReservaConfirmada(reservaID, clienteID, barberoID, confirmadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "reserva_confirmada",
		EntidadTipo: "reserva",
		EntidadID:   reservaID,
		ClienteID:   clienteID,
		UsuarioID:   confirmadoPor,
		Datos:       map[string]any{"barbero_id": barberoID},
		OcurridoEn:  time.Now(),
	}
}

func ReservaCancelada(reservaID, clienteID, canceladoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "reserva_cancelada",
		EntidadTipo: "reserva",
		EntidadID:   reservaID,
		ClienteID:   clienteID,
		UsuarioID:   canceladoPor,
		OcurridoEn:  time.Now(),
	}
}

func ReservaCompletada(reservaID, clienteID, completadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "reserva_completada",
		EntidadTipo: "reserva",
		EntidadID:   reservaID,
		ClienteID:   clienteID,
		UsuarioID:   completadoPor,
		OcurridoEn:  time.Now(),
	}
}

func BarberoActualizado(barberoID, empresaID, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "barbero_actualizado",
		EntidadTipo: "barbero",
		EntidadID:   barberoID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

func BarberoEstadoCambiado(barberoID, empresaID, estado, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "barbero_estado_cambiado",
		EntidadTipo: "barbero",
		EntidadID:   barberoID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID, "estado": estado},
		OcurridoEn:  time.Now(),
	}
}

func ServicioDesasignado(barberoID, servicioID, empresaID, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "servicio_desasignado",
		EntidadTipo: "barbero",
		EntidadID:   barberoID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID, "servicio_id": servicioID},
		OcurridoEn:  time.Now(),
	}
}

func ServicioActualizado(servicioID, empresaID, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "servicio_actualizado",
		EntidadTipo: "servicio",
		EntidadID:   servicioID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

func ServicioEstadoCambiado(servicioID, empresaID, estado, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "servicio_estado_cambiado",
		EntidadTipo: "servicio",
		EntidadID:   servicioID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID, "estado": estado},
		OcurridoEn:  time.Now(),
	}
}

func ClienteActualizado(clienteID, empresaID, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "cliente_actualizado",
		EntidadTipo: "cliente",
		EntidadID:   clienteID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

func ClienteEstadoCambiado(clienteID, empresaID, estado, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "cliente_estado_cambiado",
		EntidadTipo: "cliente",
		EntidadID:   clienteID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID, "estado": estado},
		OcurridoEn:  time.Now(),
	}
}

func SucursalEstadoCambiado(sucursalID, empresaID, estado, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "sucursal_estado_cambiado",
		EntidadTipo: "sucursal",
		EntidadID:   sucursalID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID, "estado": estado},
		OcurridoEn:  time.Now(),
	}
}

func ProgramaLealtadCreado(programaID, empresaID, nombre, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "programa_lealtad_creado",
		EntidadTipo: "programa_lealtad",
		EntidadID:   programaID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"empresa_id": empresaID, "nombre": nombre},
		OcurridoEn:  time.Now(),
	}
}

func ReservaActualizada(reservaID, empresaID, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "reserva_actualizada",
		EntidadTipo: "reserva",
		EntidadID:   reservaID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

func ConfiguracionEmpresaActualizada(empresaID, actualizadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "configuracion_empresa_actualizada",
		EntidadTipo: "empresa",
		EntidadID:   empresaID,
		UsuarioID:   actualizadoPor,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

// ── Agenda — TarifaEspecial ───────────────────────────────────────────────────

func TarifaEspecialCreada(tarifaID, sucursalID, servicioID, fecha, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "tarifa_especial_creada",
		EntidadTipo: "tarifa_especial",
		EntidadID:   tarifaID,
		UsuarioID:   creadoPor,
		Datos: map[string]any{
			"sucursal_id": sucursalID,
			"servicio_id": servicioID,
			"fecha":       fecha,
		},
		OcurridoEn: time.Now(),
	}
}

// ── Notificaciones ────────────────────────────────────────────────────────────

func PlantillaMensajeCreada(plantillaID, empresaID, nombre, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "plantilla_mensaje_creada",
		EntidadTipo: "plantilla_mensaje",
		EntidadID:   plantillaID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"empresa_id": empresaID, "nombre": nombre},
		OcurridoEn:  time.Now(),
	}
}

// ── Reservas — extras ─────────────────────────────────────────────────────────

func ClienteIngresadoListaEspera(listaEsperaID, clienteID, empresaID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "cliente_ingresado_lista_espera",
		EntidadTipo: "lista_espera",
		EntidadID:   listaEsperaID,
		ClienteID:   clienteID,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

func ComplementoReservaAgregado(reservaID, productoID, registradoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "complemento_reserva_agregado",
		EntidadTipo: "complemento_reserva",
		EntidadID:   reservaID,
		UsuarioID:   registradoPor,
		Datos:       map[string]any{"producto_id": productoID},
		OcurridoEn:  time.Now(),
	}
}

// ── Identidad — Refresh ───────────────────────────────────────────────────────

func SesionRefrescada(sesionID, usuarioID, empresaID string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "sesion_refrescada",
		EntidadTipo: "sesion_global",
		EntidadID:   sesionID,
		UsuarioID:   usuarioID,
		Datos:       map[string]any{"empresa_id": empresaID},
		OcurridoEn:  time.Now(),
	}
}

// ── Inventario ───────────────────────────────────────────────────────────────

func ProductoCreado(productoID, empresaID, nombre, creadoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "producto_creado",
		EntidadTipo: "producto",
		EntidadID:   productoID,
		UsuarioID:   creadoPor,
		Datos:       map[string]any{"empresa_id": empresaID, "nombre": nombre},
		OcurridoEn:  time.Now(),
	}
}

func MovimientoInventarioRegistrado(movimientoID, productoID, sucursalID, tipoMovimiento, registradoPor string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "movimiento_inventario_registrado",
		EntidadTipo: "movimiento_inventario",
		EntidadID:   movimientoID,
		UsuarioID:   registradoPor,
		Datos: map[string]any{
			"producto_id":  productoID,
			"sucursal_id":  sucursalID,
			"tipo":         tipoMovimiento,
		},
		OcurridoEn: time.Now(),
	}
}

// ── Canal WhatsApp ───────────────────────────────────────────────────────────

func ConversacionAbierta(conversacionID, barberiaID, numeroCliente string) EventoDominio {
	return EventoDominio{
		ID:          nuevoID(),
		Tipo:        "conversacion_abierta",
		EntidadTipo: "conversacion",
		EntidadID:   conversacionID,
		Datos:       map[string]any{"barberia_id": barberiaID, "numero_cliente": numeroCliente},
		OcurridoEn:  time.Now(),
	}
}

