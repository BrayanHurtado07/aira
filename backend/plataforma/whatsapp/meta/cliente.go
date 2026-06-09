package meta

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

const apiVersion = "v20.0"
const urlBase = "https://graph.facebook.com"

type ClienteMeta struct {
	httpClient *http.Client
}

func NuevoClienteMeta() *ClienteMeta {
	return &ClienteMeta{httpClient: &http.Client{}}
}

// EnviarTexto envía un mensaje de texto libre (solo válido dentro de la
// ventana de 24 h desde el último mensaje del cliente).
func (c *ClienteMeta) EnviarTexto(
	ctx context.Context,
	phoneNumberID, accessToken, para, mensaje string,
) error {
	cuerpo := map[string]any{
		"messaging_product": "whatsapp",
		"recipient_type":    "individual",
		"to":                para,
		"type":              "text",
		"text": map[string]any{
			"preview_url": false,
			"body":        mensaje,
		},
	}
	return c.llamar(ctx, phoneNumberID, accessToken, cuerpo)
}

// EnviarPlantilla envía un mensaje usando una plantilla aprobada por Meta.
// params son los valores que rellenan los {{1}}, {{2}}, ... del cuerpo.
func (c *ClienteMeta) EnviarPlantilla(
	ctx context.Context,
	phoneNumberID, accessToken, para, nombrePlantilla, idioma string,
	params []string,
) error {
	parametros := make([]map[string]string, len(params))
	for i, p := range params {
		parametros[i] = map[string]string{"type": "text", "text": p}
	}

	cuerpo := map[string]any{
		"messaging_product": "whatsapp",
		"to":                para,
		"type":              "template",
		"template": map[string]any{
			"name":     nombrePlantilla,
			"language": map[string]string{"code": idioma},
			"components": []map[string]any{
				{"type": "body", "parameters": parametros},
			},
		},
	}
	return c.llamar(ctx, phoneNumberID, accessToken, cuerpo)
}

func (c *ClienteMeta) llamar(ctx context.Context, phoneNumberID, accessToken string, cuerpo any) error {
	datos, err := json.Marshal(cuerpo)
	if err != nil {
		return fmt.Errorf("meta: serializar cuerpo: %w", err)
	}

	url := fmt.Sprintf("%s/%s/%s/messages", urlBase, apiVersion, phoneNumberID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(datos))
	if err != nil {
		return fmt.Errorf("meta: crear request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("meta: enviar request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errResp struct {
			Error struct {
				Message string `json:"message"`
				Code    int    `json:"code"`
			} `json:"error"`
		}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("meta: error %d — %s", errResp.Error.Code, errResp.Error.Message)
	}

	return nil
}
