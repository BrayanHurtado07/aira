package aira

import (
	"context"
	"testing"
)

func TestInterpreteReglas_Interpretar(t *testing.T) {
	interprete := NuevoInterpreteReglas()
	ctx := context.Background()

	casos := []struct {
		texto  string
		espera IntencionTipo
	}{
		{"Hola buenas tardes", IntencionSaludar},
		{"¿en qué sede atienden?", IntencionListarSedes},
		{"quiero saber la disponibilidad", IntencionDisponibilidad},
		{"quiero agendar un corte", IntencionAgendar},
		{"reservar para mañana", IntencionAgendar},
		{"gracias, hasta luego", IntencionDespedir},
		{"asdfqwerty", IntencionNoEntendido},
	}

	for _, c := range casos {
		got, err := interprete.Interpretar(ctx, c.texto)
		if err != nil {
			t.Fatalf("Interpretar(%q) error inesperado: %v", c.texto, err)
		}
		if got.Tipo != c.espera {
			t.Errorf("Interpretar(%q) = %q; espera %q", c.texto, got.Tipo, c.espera)
		}
	}
}

func TestInterpreteReglas_Nombre(t *testing.T) {
	if n := NuevoInterpreteReglas().Nombre(); n == "" {
		t.Error("Nombre() no debe ser vacío")
	}
}
