package casos_uso

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"aira/capacidades/canal_whatsapp/sesion_chat"
)

// OpcionChat es una opción que el bot ofrece (sede, servicio, barbero).
type OpcionChat struct {
	ID     string
	Nombre string
}

// DependenciasAgenda son los catálogos y acciones que el flujo de agendamiento
// necesita. El adaptador a los repositorios vive en la composición (main.go),
// para que este caso de uso no dependa de la infraestructura.
type DependenciasAgenda interface {
	ListarSedes(ctx context.Context, empresaID string) ([]OpcionChat, error)
	ListarServicios(ctx context.Context, empresaID string) ([]OpcionChat, error)
	BarberosDisponibles(ctx context.Context, empresaID, sucursalID, servicioID, fechaHoraInicio string) ([]OpcionChat, error)
	RegistrarClientePorTelefono(ctx context.Context, empresaID, telefono string) (string, error)
	CrearReserva(ctx context.Context, empresaID, sucursalID, clienteID, barberoID, servicioID, fechaHoraInicio string) error
}

// Pasos del flujo de agendamiento (guardados en sesion_chat.paso_actual).
const (
	pasoSede      = "AG_SEDE"
	pasoServicio  = "AG_SERVICIO"
	pasoFecha     = "AG_FECHA"
	pasoConfirmar = "AG_CONFIRMAR"
)

type contextoAgenda struct {
	SucursalID     string `json:"sucursal_id"`
	SucursalNombre string `json:"sucursal_nombre"`
	ServicioID     string `json:"servicio_id"`
	ServicioNombre string `json:"servicio_nombre"`
	BarberoID      string `json:"barbero_id"`
	BarberoNombre  string `json:"barbero_nombre"`
	FechaHora      string `json:"fecha_hora"`  // ISO con zona
	FechaTexto     string `json:"fecha_texto"` // como lo escribió el cliente
}

// FlujoAgenda es la máquina de estados conversacional para reservar desde el chat.
type FlujoAgenda struct {
	deps       DependenciasAgenda
	sesion     *CasoUsoGestionarSesionChat
	repoSesion sesion_chat.RepositorioSesionChat
}

func NuevoFlujoAgenda(deps DependenciasAgenda, sesion *CasoUsoGestionarSesionChat, repo sesion_chat.RepositorioSesionChat) *FlujoAgenda {
	return &FlujoAgenda{deps: deps, sesion: sesion, repoSesion: repo}
}

// PasoActivo devuelve el paso de agendamiento en curso para la conversación, o ""
// si no hay un flujo de reserva activo.
func (f *FlujoAgenda) PasoActivo(ctx context.Context, conversacionID string) string {
	s, err := f.repoSesion.ObtenerPorConversacion(ctx, conversacionID)
	if err != nil {
		return ""
	}
	switch s.PasoActual {
	case pasoSede, pasoServicio, pasoFecha, pasoConfirmar:
		return s.PasoActual
	default:
		return ""
	}
}

// Manejar avanza la conversación de reserva un paso y devuelve la respuesta del bot.
func (f *FlujoAgenda) Manejar(ctx context.Context, conversacionID, empresaID, telefono, texto string) string {
	paso := f.PasoActivo(ctx, conversacionID)
	cxt := f.leerContexto(ctx, conversacionID)

	switch paso {
	case "": // arranque del flujo
		return f.iniciar(ctx, conversacionID, empresaID)
	case pasoSede:
		return f.elegirSede(ctx, conversacionID, empresaID, texto, cxt)
	case pasoServicio:
		return f.elegirServicio(ctx, conversacionID, empresaID, texto, cxt)
	case pasoFecha:
		return f.elegirFecha(ctx, conversacionID, empresaID, texto, cxt)
	case pasoConfirmar:
		return f.confirmar(ctx, conversacionID, empresaID, telefono, texto, cxt)
	default:
		return "Disculpa, reinicia tu reserva diciéndome 'quiero agendar'."
	}
}

func (f *FlujoAgenda) iniciar(ctx context.Context, conversacionID, empresaID string) string {
	sedes, err := f.deps.ListarSedes(ctx, empresaID)
	if err != nil || len(sedes) == 0 {
		return "Por ahora no puedo agendar: no hay sedes disponibles."
	}
	f.guardar(ctx, conversacionID, pasoSede, contextoAgenda{})
	return "¡Vamos a agendar tu corte! 💈\n¿En qué sede?\n" + listarOpciones(sedes)
}

func (f *FlujoAgenda) elegirSede(ctx context.Context, conversacionID, empresaID, texto string, cxt contextoAgenda) string {
	sedes, _ := f.deps.ListarSedes(ctx, empresaID)
	op, ok := emparejar(texto, sedes)
	if !ok {
		return "No encontré esa sede 🤔\nElige una:\n" + listarOpciones(sedes)
	}
	cxt.SucursalID, cxt.SucursalNombre = op.ID, op.Nombre
	servicios, _ := f.deps.ListarServicios(ctx, empresaID)
	if len(servicios) == 0 {
		return "Esa sede no tiene servicios cargados todavía."
	}
	f.guardar(ctx, conversacionID, pasoServicio, cxt)
	return fmt.Sprintf("Perfecto, %s. ¿Qué servicio quieres?\n%s", cxt.SucursalNombre, listarOpciones(servicios))
}

func (f *FlujoAgenda) elegirServicio(ctx context.Context, conversacionID, empresaID, texto string, cxt contextoAgenda) string {
	servicios, _ := f.deps.ListarServicios(ctx, empresaID)
	op, ok := emparejar(texto, servicios)
	if !ok {
		return "No reconocí ese servicio 🤔\nElige uno:\n" + listarOpciones(servicios)
	}
	cxt.ServicioID, cxt.ServicioNombre = op.ID, op.Nombre
	f.guardar(ctx, conversacionID, pasoFecha, cxt)
	return fmt.Sprintf("Genial, %s. ¿Para qué fecha y hora? (ejemplo: 2026-07-15 14:00)", cxt.ServicioNombre)
}

func (f *FlujoAgenda) elegirFecha(ctx context.Context, conversacionID, empresaID, texto string, cxt contextoAgenda) string {
	iso, ok := parsearFecha(texto)
	if !ok {
		return "No entendí la fecha 😅 Usa el formato 2026-07-15 14:00 (año-mes-día hora:minuto)."
	}
	barberos, err := f.deps.BarberosDisponibles(ctx, empresaID, cxt.SucursalID, cxt.ServicioID, iso)
	if err != nil || len(barberos) == 0 {
		return "No hay barberos libres a esa hora 😕 Prueba con otra fecha u hora."
	}
	cxt.BarberoID, cxt.BarberoNombre = barberos[0].ID, barberos[0].Nombre
	cxt.FechaHora, cxt.FechaTexto = iso, strings.TrimSpace(texto)
	f.guardar(ctx, conversacionID, pasoConfirmar, cxt)
	return fmt.Sprintf("Confirmo tu reserva:\n• %s\n• %s\n• %s\n• Barbero: %s\n¿Confirmas? (sí / no)",
		cxt.ServicioNombre, cxt.SucursalNombre, cxt.FechaTexto, cxt.BarberoNombre)
}

func (f *FlujoAgenda) confirmar(ctx context.Context, conversacionID, empresaID, telefono, texto string, cxt contextoAgenda) string {
	if !esAfirmacion(texto) {
		f.guardar(ctx, conversacionID, "AG_HECHO", contextoAgenda{})
		return "Listo, cancelé la reserva. Si quieres, dime 'agendar' para empezar de nuevo."
	}
	clienteID, err := f.deps.RegistrarClientePorTelefono(ctx, empresaID, telefono)
	if err != nil {
		return "No pude registrar tus datos para reservar. Intenta de nuevo en un momento."
	}
	if err := f.deps.CrearReserva(ctx, empresaID, cxt.SucursalID, clienteID, cxt.BarberoID, cxt.ServicioID, cxt.FechaHora); err != nil {
		return "No pude confirmar la reserva (quizá ese horario ya se ocupó). Prueba con otra hora diciéndome 'agendar'."
	}
	f.guardar(ctx, conversacionID, "AG_HECHO", contextoAgenda{})
	return fmt.Sprintf("¡Reserva confirmada! ✅\n%s con %s en %s, %s.\n¡Te esperamos! 💈",
		cxt.ServicioNombre, cxt.BarberoNombre, cxt.SucursalNombre, cxt.FechaTexto)
}

// ── auxiliares ────────────────────────────────────────────────────────────────

func (f *FlujoAgenda) guardar(ctx context.Context, conversacionID, paso string, cxt contextoAgenda) {
	datos, _ := json.Marshal(cxt)
	_, _ = f.sesion.Iniciar(ctx, SolicitudIniciarSesionChat{
		ConversacionID: conversacionID,
		PasoInicial:    paso,
		ContextoJSON:   datos,
		MinutosVida:    30,
	})
}

func (f *FlujoAgenda) leerContexto(ctx context.Context, conversacionID string) contextoAgenda {
	var cxt contextoAgenda
	s, err := f.repoSesion.ObtenerPorConversacion(ctx, conversacionID)
	if err == nil && len(s.ContextoJSON) > 0 {
		_ = json.Unmarshal(s.ContextoJSON, &cxt)
	}
	return cxt
}

func listarOpciones(ops []OpcionChat) string {
	var b strings.Builder
	for _, o := range ops {
		b.WriteString("• " + o.Nombre + "\n")
	}
	return b.String()
}

// emparejar busca la opción que coincide con lo que escribió el cliente.
func emparejar(texto string, ops []OpcionChat) (OpcionChat, bool) {
	t := strings.ToLower(strings.TrimSpace(texto))
	for _, o := range ops {
		n := strings.ToLower(o.Nombre)
		if strings.Contains(n, t) || strings.Contains(t, n) {
			return o, true
		}
	}
	// segundo intento: por palabra suelta
	for _, o := range ops {
		n := strings.ToLower(o.Nombre)
		for _, palabra := range strings.Fields(t) {
			if len(palabra) >= 3 && strings.Contains(n, palabra) {
				return o, true
			}
		}
	}
	return OpcionChat{}, false
}

func parsearFecha(texto string) (string, bool) {
	t := strings.TrimSpace(texto)
	for _, layout := range []string{"2006-01-02 15:04", "2006-01-02 15:04:05", "2006-01-02T15:04"} {
		if parsed, err := time.Parse(layout, t); err == nil {
			return parsed.Format("2006-01-02T15:04:05") + "-05:00", true
		}
	}
	return "", false
}

func esAfirmacion(texto string) bool {
	t := strings.ToLower(strings.TrimSpace(texto))
	for _, s := range []string{"si", "sí", "claro", "dale", "confirmo", "ok", "vale", "yes"} {
		if t == s || strings.HasPrefix(t, s+" ") {
			return true
		}
	}
	return false
}
