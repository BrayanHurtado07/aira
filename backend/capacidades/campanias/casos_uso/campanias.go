// Package casos_uso — operaciones de la capacidad Campañas.
package casos_uso

import (
	"context"

	"aira/capacidades/campanias"
	"aira/plataforma/gobierno/auditoria"
)

// ── Crear campaña ─────────────────────────────────────────────────────────────

type SolicitudCrearCampana struct {
	EmpresaID      string `json:"-"`
	PlantillaID    string `json:"plantilla_id"`
	Nombre         string `json:"nombre"`
	Tipo           string `json:"tipo"`
	ProgramadaPara string `json:"programada_para"`
	CreadoPor      string `json:"-"`
}

type CasoUsoCrearCampana struct {
	repo      campanias.RepositorioCampana
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoCrearCampana(repo campanias.RepositorioCampana, aud auditoria.Auditoria) *CasoUsoCrearCampana {
	return &CasoUsoCrearCampana{repo: repo, auditoria: aud}
}

func (c *CasoUsoCrearCampana) Ejecutar(ctx context.Context, s SolicitudCrearCampana) (string, error) {
	tipo := s.Tipo
	if tipo == "" {
		tipo = "MANUAL"
	}
	id, err := c.repo.CrearCampana(ctx, s.EmpresaID, s.PlantillaID, s.Nombre, tipo, s.ProgramadaPara, s.CreadoPor)
	if err != nil {
		return "", err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.CreadoPor, EmpresaID: s.EmpresaID,
		Entidad: "campana", EntidadID: id, Accion: "CREAR",
	})
	return id, nil
}

// ── Cargar destinatarios inactivos (segmentación) ────────────────────────────

type CasoUsoCargarInactivos struct {
	repo campanias.RepositorioCampana
}

func NuevoCasoUsoCargarInactivos(repo campanias.RepositorioCampana) *CasoUsoCargarInactivos {
	return &CasoUsoCargarInactivos{repo: repo}
}

func (c *CasoUsoCargarInactivos) Ejecutar(ctx context.Context, campanaID string, dias int, agregadoPor string) (int, error) {
	return c.repo.CargarInactivos(ctx, campanaID, dias, agregadoPor)
}

// ── Despachar campaña ────────────────────────────────────────────────────────

type CasoUsoDespacharCampana struct {
	repo      campanias.RepositorioCampana
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoDespacharCampana(repo campanias.RepositorioCampana, aud auditoria.Auditoria) *CasoUsoDespacharCampana {
	return &CasoUsoDespacharCampana{repo: repo, auditoria: aud}
}

func (c *CasoUsoDespacharCampana) Ejecutar(ctx context.Context, campanaID, empresaID, despachadoPor string) (int, error) {
	enviados, err := c.repo.Despachar(ctx, campanaID, despachadoPor)
	if err != nil {
		return 0, err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: despachadoPor, EmpresaID: empresaID,
		Entidad: "campana", EntidadID: campanaID, Accion: "ACTUALIZAR",
		Detalle: map[string]any{"enviados": enviados},
	})
	return enviados, nil
}
