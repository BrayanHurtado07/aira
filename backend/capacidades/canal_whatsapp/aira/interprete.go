// Package aira — el cerebro conversacional de Aira IA: interpreta el mensaje del
// cliente y lo clasifica en una intención que el orquestador sabe atender.
package aira

import (
	"context"
	"encoding/json"
	"strings"

	"aira/plataforma/ia/claude"
)

type IntencionTipo string

const (
	IntencionSaludar      IntencionTipo = "SALUDAR"
	IntencionListarSedes  IntencionTipo = "LISTAR_SEDES"
	IntencionDisponibilidad IntencionTipo = "CONSULTAR_DISPONIBILIDAD"
	IntencionAgendar      IntencionTipo = "AGENDAR"
	IntencionDespedir     IntencionTipo = "DESPEDIR"
	IntencionNoEntendido  IntencionTipo = "NO_ENTENDIDO"
)

// Intencion es lo que el cliente quiere, ya estructurado.
type Intencion struct {
	Tipo  IntencionTipo `json:"tipo"`
	Fecha string        `json:"fecha,omitempty"` // fecha mencionada, si la hay
}

// InterpreteIA es el cerebro: convierte texto libre en una intención.
type InterpreteIA interface {
	Interpretar(ctx context.Context, texto string) (Intencion, error)
	Nombre() string
}

// ── Intérprete por reglas (dev: sin clave, testeable local) ───────────────────

type InterpreteReglas struct{}

func NuevoInterpreteReglas() *InterpreteReglas { return &InterpreteReglas{} }

func (i *InterpreteReglas) Nombre() string { return "reglas" }

func (i *InterpreteReglas) Interpretar(_ context.Context, texto string) (Intencion, error) {
	t := strings.ToLower(texto)
	switch {
	case contiene(t, "hola", "buenas", "buenos dias", "buenas tardes", "que tal"):
		return Intencion{Tipo: IntencionSaludar}, nil
	case contiene(t, "sede", "sedes", "sucursal", "donde quedan", "ubicacion"):
		return Intencion{Tipo: IntencionListarSedes}, nil
	case contiene(t, "disponib", "horario", "hora libre", "espacio", "que horas"):
		return Intencion{Tipo: IntencionDisponibilidad}, nil
	case contiene(t, "agendar", "reservar", "cita", "corte", "turno", "quiero un"):
		return Intencion{Tipo: IntencionAgendar}, nil
	case contiene(t, "gracias", "chao", "adios", "hasta luego", "nos vemos"):
		return Intencion{Tipo: IntencionDespedir}, nil
	default:
		return Intencion{Tipo: IntencionNoEntendido}, nil
	}
}

func contiene(texto string, claves ...string) bool {
	for _, k := range claves {
		if strings.Contains(texto, k) {
			return true
		}
	}
	return false
}

// ── Intérprete con Claude (producción: requiere ANTHROPIC_API_KEY) ────────────

type InterpreteClaude struct {
	cliente *claude.ClienteClaude
	respaldo *InterpreteReglas
}

func NuevoInterpreteClaude(cliente *claude.ClienteClaude) *InterpreteClaude {
	return &InterpreteClaude{cliente: cliente, respaldo: NuevoInterpreteReglas()}
}

func (i *InterpreteClaude) Nombre() string { return "claude" }

const sistemaClasificador = `Eres Aira, asistente de una barbería por WhatsApp. Clasifica el mensaje del cliente en UNA intención y responde SOLO con JSON, sin texto adicional.
Intenciones válidas: SALUDAR, LISTAR_SEDES, CONSULTAR_DISPONIBILIDAD, AGENDAR, DESPEDIR, NO_ENTENDIDO.
Formato: {"tipo":"<INTENCION>","fecha":"<fecha mencionada o vacío>"}`

func (i *InterpreteClaude) Interpretar(ctx context.Context, texto string) (Intencion, error) {
	respuesta, err := i.cliente.Completar(ctx, sistemaClasificador, texto)
	if err != nil {
		// Si el modelo falla, no dejamos al cliente sin respuesta: caemos a reglas.
		return i.respaldo.Interpretar(ctx, texto)
	}
	var intencion Intencion
	if err := json.Unmarshal([]byte(strings.TrimSpace(respuesta)), &intencion); err != nil || intencion.Tipo == "" {
		return i.respaldo.Interpretar(ctx, texto)
	}
	return intencion, nil
}
