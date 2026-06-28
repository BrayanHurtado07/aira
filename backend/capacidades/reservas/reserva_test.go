package reservas

import (
	"errors"
	"testing"

	dominioErr "aira/compartido/errores"
)

// La matriz cubre las 5 estados × 4 guardas del ciclo de vida de una reserva.
// Blinda el dinero: ninguna transición ilegal puede pasar (confirmar algo ya
// cancelado, completar lo no confirmado, etc.).

var todosLosEstados = []EstadoReserva{
	EstadoReservaPendiente,
	EstadoReservaConfirmada,
	EstadoReservaCancelada,
	EstadoReservaCompletada,
	EstadoReservaNoAsistio,
}

func TestReserva_ValidarPuedeConfirmarse(t *testing.T) {
	// Solo PENDIENTE puede confirmarse.
	permitidos := map[EstadoReserva]bool{EstadoReservaPendiente: true}
	for _, e := range todosLosEstados {
		err := Reserva{Estado: e}.ValidarPuedeConfirmarse()
		if permitidos[e] && err != nil {
			t.Errorf("estado %s: esperaba confirmar OK; got %v", e, err)
		}
		if !permitidos[e] {
			if !errors.Is(err, dominioErr.ErrReservaNoConfirmable) {
				t.Errorf("estado %s: esperaba ErrReservaNoConfirmable; got %v", e, err)
			}
		}
	}
}

func TestReserva_ValidarPuedeCancelarse(t *testing.T) {
	// Todo salvo COMPLETADA y CANCELADA puede cancelarse.
	bloqueados := map[EstadoReserva]bool{
		EstadoReservaCompletada: true,
		EstadoReservaCancelada:  true,
	}
	for _, e := range todosLosEstados {
		err := Reserva{Estado: e}.ValidarPuedeCancelarse()
		if bloqueados[e] {
			if !errors.Is(err, dominioErr.ErrReservaYaCerrada) {
				t.Errorf("estado %s: esperaba ErrReservaYaCerrada; got %v", e, err)
			}
		} else if err != nil {
			t.Errorf("estado %s: esperaba cancelar OK; got %v", e, err)
		}
	}
}

func TestReserva_ValidarPuedeCompletarse(t *testing.T) {
	// Solo CONFIRMADA puede completarse.
	permitidos := map[EstadoReserva]bool{EstadoReservaConfirmada: true}
	for _, e := range todosLosEstados {
		err := Reserva{Estado: e}.ValidarPuedeCompletarse()
		if permitidos[e] && err != nil {
			t.Errorf("estado %s: esperaba completar OK; got %v", e, err)
		}
		if !permitidos[e] && !errors.Is(err, dominioErr.ErrReservaNoCompletable) {
			t.Errorf("estado %s: esperaba ErrReservaNoCompletable; got %v", e, err)
		}
	}
}

func TestReserva_ValidarPuedeActualizarse(t *testing.T) {
	// Solo PENDIENTE y CONFIRMADA (reservas abiertas) pueden actualizarse.
	permitidos := map[EstadoReserva]bool{
		EstadoReservaPendiente:  true,
		EstadoReservaConfirmada: true,
	}
	for _, e := range todosLosEstados {
		err := Reserva{Estado: e}.ValidarPuedeActualizarse()
		if permitidos[e] && err != nil {
			t.Errorf("estado %s: esperaba actualizar OK; got %v", e, err)
		}
		if !permitidos[e] && !errors.Is(err, dominioErr.ErrReservaYaCerrada) {
			t.Errorf("estado %s: esperaba ErrReservaYaCerrada; got %v", e, err)
		}
	}
}

// Recorrido feliz: el ciclo de vida válido completo no debe bloquearse en ningún paso.
func TestReserva_CicloDeVidaFeliz(t *testing.T) {
	r := Reserva{Estado: EstadoReservaPendiente}
	if err := r.ValidarPuedeConfirmarse(); err != nil {
		t.Fatalf("PENDIENTE→CONFIRMADA bloqueada: %v", err)
	}
	r.Estado = EstadoReservaConfirmada
	if err := r.ValidarPuedeCompletarse(); err != nil {
		t.Fatalf("CONFIRMADA→COMPLETADA bloqueada: %v", err)
	}
	r.Estado = EstadoReservaCompletada
	// Una reserva completada ya no se confirma, cancela ni actualiza.
	if r.ValidarPuedeConfirmarse() == nil || r.ValidarPuedeCancelarse() == nil || r.ValidarPuedeActualizarse() == nil {
		t.Error("una reserva COMPLETADA no debería aceptar más transiciones")
	}
}
