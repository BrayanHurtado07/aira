package campanias

import "context"

// Campana es una campaña con sus métricas de destinatarios y envíos (lectura).
type Campana struct {
	ID             string `json:"id"`
	Nombre         string `json:"nombre"`
	Tipo           string `json:"tipo"`
	Estado         string `json:"estado"`
	ProgramadaPara string `json:"programada_para"`
	CreadoEn       string `json:"creado_en"`
	Destinatarios  int    `json:"destinatarios"`
	Enviados       int    `json:"enviados"`
}

// RepositorioCampana persiste campañas, destinatarios y logs de envío.
type RepositorioCampana interface {
	CrearCampana(ctx context.Context, empresaID, plantillaID, nombre, tipo, programadaPara, creadoPor string) (string, error)
	CargarInactivos(ctx context.Context, campanaID string, dias int, agregadoPor string) (int, error)
	Despachar(ctx context.Context, campanaID, despachadoPor string) (int, error)
	ListarCampanas(ctx context.Context, empresaID string) ([]Campana, error)
}
