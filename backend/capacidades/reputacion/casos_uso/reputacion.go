// Package casos_uso — operaciones de la capacidad Reputación.
package casos_uso

import (
	"context"

	"aira/capacidades/reputacion"
	"aira/plataforma/gobierno/auditoria"
)

// ── Registrar reseña (cliente, público) ──────────────────────────────────────

type SolicitudRegistrarResena struct {
	ReservaID       string `json:"reserva_id"`
	PuntajeBarbero  int    `json:"puntaje_barbero"`
	PuntajeSucursal int    `json:"puntaje_sucursal"`
	Comentario      string `json:"comentario"`
	CreadoPor       string `json:"-"`
}

type CasoUsoRegistrarResena struct {
	repo reputacion.RepositorioReputacion
}

func NuevoCasoUsoRegistrarResena(repo reputacion.RepositorioReputacion) *CasoUsoRegistrarResena {
	return &CasoUsoRegistrarResena{repo: repo}
}

func (c *CasoUsoRegistrarResena) Ejecutar(ctx context.Context, s SolicitudRegistrarResena) (string, error) {
	return c.repo.RegistrarResena(ctx, s.ReservaID, s.PuntajeBarbero, s.PuntajeSucursal, s.Comentario, s.CreadoPor)
}

// ── Actualizar estado de reseña (admin: publicar / moderar / eliminar) ───────

type CasoUsoActualizarEstadoResena struct {
	repo      reputacion.RepositorioReputacion
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoActualizarEstadoResena(repo reputacion.RepositorioReputacion, aud auditoria.Auditoria) *CasoUsoActualizarEstadoResena {
	return &CasoUsoActualizarEstadoResena{repo: repo, auditoria: aud}
}

func (c *CasoUsoActualizarEstadoResena) Ejecutar(ctx context.Context, resenaID, nuevoEstado, actualizadoPor, empresaID string) error {
	if err := c.repo.ActualizarEstado(ctx, resenaID, nuevoEstado, actualizadoPor); err != nil {
		return err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: actualizadoPor, EmpresaID: empresaID,
		Entidad: "resena", EntidadID: resenaID, Accion: "ACTUALIZAR",
		Detalle: map[string]any{"nuevo_estado": nuevoEstado},
	})
	return nil
}
