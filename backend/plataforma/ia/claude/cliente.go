// Package claude — cliente del modelo Claude (Anthropic) para Aira IA.
// Usa HTTP directo (sin SDK) para no agregar dependencias. Se activa solo si
// hay ANTHROPIC_API_KEY; en dev (sin clave) el cerebro usa el intérprete de reglas.
package claude

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

const (
	urlMensajes    = "https://api.anthropic.com/v1/messages"
	versionAPI     = "2023-06-01"
	modeloPorDef   = "claude-opus-4-8"
	maxTokensPorDef = 512
)

type ClienteClaude struct {
	apiKey string
	http   *http.Client
}

func NuevoClienteClaude() *ClienteClaude {
	return &ClienteClaude{
		apiKey: os.Getenv("ANTHROPIC_API_KEY"),
		http:   &http.Client{Timeout: 30 * time.Second},
	}
}

// Disponible indica si hay credencial para hablar con el modelo real.
func (c *ClienteClaude) Disponible() bool {
	return c.apiKey != ""
}

// Completar envía un prompt (sistema + usuario) y devuelve el texto de la respuesta.
func (c *ClienteClaude) Completar(ctx context.Context, sistema, usuario string) (string, error) {
	if !c.Disponible() {
		return "", fmt.Errorf("claude no disponible: falta ANTHROPIC_API_KEY")
	}

	cuerpo := map[string]any{
		"model":      modeloPorDef,
		"max_tokens": maxTokensPorDef,
		"system":     sistema,
		"messages": []map[string]any{
			{"role": "user", "content": usuario},
		},
	}
	datos, _ := json.Marshal(cuerpo)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, urlMensajes, bytes.NewReader(datos))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", versionAPI)

	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("claude respondio %d", resp.StatusCode)
	}

	var salida struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&salida); err != nil {
		return "", err
	}
	for _, b := range salida.Content {
		if b.Type == "text" {
			return b.Text, nil
		}
	}
	return "", fmt.Errorf("claude no devolvio texto")
}
