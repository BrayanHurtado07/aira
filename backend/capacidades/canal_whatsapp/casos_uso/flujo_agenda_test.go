package casos_uso

import (
	"context"
	"fmt"
	"strings"
	"testing"

	"aira/capacidades/canal_whatsapp/sesion_chat"
)

// ── Tests de las funciones puras ────────────────────────────────────────────────

func TestEmparejar(t *testing.T) {
	ops := []OpcionChat{
		{ID: "1", Nombre: "Corte Clásico"},
		{ID: "2", Nombre: "Fade Degradado"},
	}
	casos := []struct {
		texto    string
		esperaID string
		ok       bool
	}{
		{"corte", "1", true},
		{"Corte Clásico", "1", true},
		{"fade", "2", true},
		{"FADE", "2", true},
		{"manicure", "", false},
	}
	for _, c := range casos {
		op, ok := emparejar(c.texto, ops)
		if ok != c.ok || op.ID != c.esperaID {
			t.Errorf("emparejar(%q) = (%q,%v); espera (%q,%v)", c.texto, op.ID, ok, c.esperaID, c.ok)
		}
	}
}

func TestParsearFecha(t *testing.T) {
	casos := []struct {
		texto   string
		esperaa string
		ok      bool
	}{
		{"2026-07-15 14:00", "2026-07-15T14:00:00-05:00", true},
		{"2026-07-15 14:00:30", "2026-07-15T14:00:30-05:00", true},
		{"  2026-07-15 14:00  ", "2026-07-15T14:00:00-05:00", true},
		{"mañana a las 3", "", false},
		{"", "", false},
	}
	for _, c := range casos {
		got, ok := parsearFecha(c.texto)
		if ok != c.ok || got != c.esperaa {
			t.Errorf("parsearFecha(%q) = (%q,%v); espera (%q,%v)", c.texto, got, ok, c.esperaa, c.ok)
		}
	}
}

func TestEsAfirmacion(t *testing.T) {
	afirmativos := []string{"si", "sí", "Claro", "dale", "confirmo", "OK", "  vale  ", "dale pues"}
	negativos := []string{"no", "nope", "mejor no", "cancelar", ""}
	for _, s := range afirmativos {
		if !esAfirmacion(s) {
			t.Errorf("esAfirmacion(%q) = false; espera true", s)
		}
	}
	for _, s := range negativos {
		if esAfirmacion(s) {
			t.Errorf("esAfirmacion(%q) = true; espera false", s)
		}
	}
}

// ── Dobles de prueba en memoria (sin BD) ────────────────────────────────────────

type repoSesionMemoria struct {
	porConversacion map[string]sesion_chat.SesionChat
	seq             int
}

func nuevoRepoSesionMemoria() *repoSesionMemoria {
	return &repoSesionMemoria{porConversacion: map[string]sesion_chat.SesionChat{}}
}

func (r *repoSesionMemoria) Iniciar(_ context.Context, s sesion_chat.SolicitudIniciarSesionChat) (sesion_chat.SesionChat, error) {
	r.seq++
	sc := sesion_chat.SesionChat{
		ID:             fmt.Sprintf("sc-%d", r.seq),
		ConversacionID: s.ConversacionID,
		PasoActual:     s.PasoInicial,
		ContextoJSON:   s.ContextoJSON,
	}
	r.porConversacion[s.ConversacionID] = sc // UPSERT: sobrescribe por conversación
	return sc, nil
}

func (r *repoSesionMemoria) Actualizar(_ context.Context, _ sesion_chat.SolicitudActualizarSesionChat) error {
	return nil
}

func (r *repoSesionMemoria) ObtenerPorConversacion(_ context.Context, conversacionID string) (sesion_chat.SesionChat, error) {
	sc, ok := r.porConversacion[conversacionID]
	if !ok {
		return sesion_chat.SesionChat{}, fmt.Errorf("no hay sesión para %s", conversacionID)
	}
	return sc, nil
}

type reservaCreada struct {
	empresaID, sucursalID, clienteID, barberoID, servicioID, fechaHora string
}

type depsMemoria struct {
	reserva *reservaCreada
}

func (d *depsMemoria) ListarSedes(_ context.Context, _ string) ([]OpcionChat, error) {
	return []OpcionChat{{ID: "sede-1", Nombre: "Sede Centro"}}, nil
}
func (d *depsMemoria) ListarServicios(_ context.Context, _ string) ([]OpcionChat, error) {
	return []OpcionChat{{ID: "srv-1", Nombre: "Corte Clásico"}}, nil
}
func (d *depsMemoria) BarberosDisponibles(_ context.Context, _, _, _, _ string) ([]OpcionChat, error) {
	return []OpcionChat{{ID: "bar-1", Nombre: "Carlos"}}, nil
}
func (d *depsMemoria) RegistrarClientePorTelefono(_ context.Context, _, _ string) (string, error) {
	return "cli-1", nil
}
func (d *depsMemoria) CrearReserva(_ context.Context, empresaID, sucursalID, clienteID, barberoID, servicioID, fechaHora string) error {
	d.reserva = &reservaCreada{empresaID, sucursalID, clienteID, barberoID, servicioID, fechaHora}
	return nil
}

// ── Test integral de la máquina de estados (sin BD) ─────────────────────────────

func TestFlujoAgenda_ReservaCompleta(t *testing.T) {
	ctx := context.Background()
	repo := nuevoRepoSesionMemoria()
	deps := &depsMemoria{}
	flujo := NuevoFlujoAgenda(deps, NuevoCasoUsoGestionarSesionChat(repo), repo)

	conv, emp, tel := "conv-1", "emp-1", "51999"

	// El cliente recorre todo el embudo de reserva.
	pasos := []struct {
		texto    string
		contiene string
	}{
		{"quiero agendar", "sede"},
		{"Centro", "servicio"},
		{"Corte", "fecha"},
		{"2026-07-15 14:00", "Confirmo"},
		{"sí", "confirmada"},
	}
	for i, p := range pasos {
		resp := flujo.Manejar(ctx, conv, emp, tel, p.texto)
		if !strings.Contains(strings.ToLower(resp), strings.ToLower(p.contiene)) {
			t.Fatalf("paso %d (%q): respuesta %q no contiene %q", i, p.texto, resp, p.contiene)
		}
	}

	// Debe haberse creado la reserva con los datos recolectados en la conversación.
	if deps.reserva == nil {
		t.Fatal("no se creó la reserva al confirmar")
	}
	r := deps.reserva
	if r.empresaID != emp || r.sucursalID != "sede-1" || r.servicioID != "srv-1" ||
		r.barberoID != "bar-1" || r.clienteID != "cli-1" ||
		r.fechaHora != "2026-07-15T14:00:00-05:00" {
		t.Errorf("reserva con datos incorrectos: %+v", r)
	}

	// Tras confirmar, ya no hay un paso de agendamiento activo.
	if paso := flujo.PasoActivo(ctx, conv); paso != "" {
		t.Errorf("se esperaba flujo cerrado; paso activo = %q", paso)
	}
}

func TestFlujoAgenda_CancelarEnConfirmacion(t *testing.T) {
	ctx := context.Background()
	repo := nuevoRepoSesionMemoria()
	deps := &depsMemoria{}
	flujo := NuevoFlujoAgenda(deps, NuevoCasoUsoGestionarSesionChat(repo), repo)

	conv, emp, tel := "conv-2", "emp-1", "51999"
	flujo.Manejar(ctx, conv, emp, tel, "agendar")
	flujo.Manejar(ctx, conv, emp, tel, "Centro")
	flujo.Manejar(ctx, conv, emp, tel, "Corte")
	flujo.Manejar(ctx, conv, emp, tel, "2026-07-15 14:00")
	resp := flujo.Manejar(ctx, conv, emp, tel, "no")

	if deps.reserva != nil {
		t.Errorf("no debía crearse reserva al cancelar; se creó %+v", deps.reserva)
	}
	if !strings.Contains(strings.ToLower(resp), "cancel") {
		t.Errorf("respuesta de cancelación inesperada: %q", resp)
	}
}
