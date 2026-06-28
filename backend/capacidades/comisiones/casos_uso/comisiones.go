// Package casos_uso — operaciones de la capacidad Comisiones.
// El permiso se valida en el manejador (autorizarOResponder); estos casos de uso
// orquestan dominio + persistencia + auditoría.
package casos_uso

import (
	"context"

	"aira/capacidades/comisiones"
	"aira/plataforma/gobierno/auditoria"
)

// ── Crear esquema de comisión ────────────────────────────────────────────────

type SolicitudCrearEsquema struct {
	EmpresaID   string  `json:"-"`
	Nombre      string  `json:"nombre"`
	Tipo        string  `json:"tipo"`
	SueldoBase  float64 `json:"sueldo_base"`
	Porcentaje  float64 `json:"porcentaje_por_servicio"`
	Descripcion string  `json:"descripcion"`
	CreadoPor   string  `json:"-"`
}

type CasoUsoCrearEsquemaComision struct {
	repo      comisiones.RepositorioComision
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoCrearEsquemaComision(repo comisiones.RepositorioComision, aud auditoria.Auditoria) *CasoUsoCrearEsquemaComision {
	return &CasoUsoCrearEsquemaComision{repo: repo, auditoria: aud}
}

func (c *CasoUsoCrearEsquemaComision) Ejecutar(ctx context.Context, s SolicitudCrearEsquema) (string, error) {
	tipo := s.Tipo
	if tipo == "" {
		tipo = "PORCENTAJE"
	}
	id, err := c.repo.CrearEsquema(ctx, s.EmpresaID, s.Nombre, tipo, s.SueldoBase, s.Porcentaje, s.Descripcion, s.CreadoPor)
	if err != nil {
		return "", err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.CreadoPor, EmpresaID: s.EmpresaID,
		Entidad: "esquema_comision", EntidadID: id, Accion: "CREAR",
	})
	return id, nil
}

// ── Generar comisión por reserva completada ──────────────────────────────────

type CasoUsoGenerarComision struct {
	repo      comisiones.RepositorioComision
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoGenerarComision(repo comisiones.RepositorioComision, aud auditoria.Auditoria) *CasoUsoGenerarComision {
	return &CasoUsoGenerarComision{repo: repo, auditoria: aud}
}

func (c *CasoUsoGenerarComision) Ejecutar(ctx context.Context, reservaID, generadoPor, empresaID string) (string, error) {
	id, err := c.repo.GenerarComision(ctx, reservaID, generadoPor)
	if err != nil {
		return "", err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: generadoPor, EmpresaID: empresaID,
		Entidad: "comision", EntidadID: id, Accion: "CREAR",
	})
	return id, nil
}

// ── Calcular liquidación ─────────────────────────────────────────────────────

type SolicitudCalcularLiquidacion struct {
	EmpresaID    string `json:"-"`
	BarberoID    string `json:"barbero_id"`
	FechaInicio  string `json:"fecha_inicio"`
	FechaFin     string `json:"fecha_fin"`
	Frecuencia   string `json:"frecuencia"`
	CalculadoPor string `json:"-"`
}

type CasoUsoCalcularLiquidacion struct {
	repo      comisiones.RepositorioComision
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoCalcularLiquidacion(repo comisiones.RepositorioComision, aud auditoria.Auditoria) *CasoUsoCalcularLiquidacion {
	return &CasoUsoCalcularLiquidacion{repo: repo, auditoria: aud}
}

func (c *CasoUsoCalcularLiquidacion) Ejecutar(ctx context.Context, s SolicitudCalcularLiquidacion) (string, error) {
	frecuencia := s.Frecuencia
	if frecuencia == "" {
		frecuencia = "MENSUAL"
	}
	id, err := c.repo.CalcularLiquidacion(ctx, s.EmpresaID, s.BarberoID, s.FechaInicio, s.FechaFin, frecuencia, s.CalculadoPor)
	if err != nil {
		return "", err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.CalculadoPor, EmpresaID: s.EmpresaID,
		Entidad: "liquidacion", EntidadID: id, Accion: "CREAR",
	})
	return id, nil
}

// ── Aprobar / Pagar liquidación ──────────────────────────────────────────────

type CasoUsoAprobarLiquidacion struct {
	repo      comisiones.RepositorioComision
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoAprobarLiquidacion(repo comisiones.RepositorioComision, aud auditoria.Auditoria) *CasoUsoAprobarLiquidacion {
	return &CasoUsoAprobarLiquidacion{repo: repo, auditoria: aud}
}

func (c *CasoUsoAprobarLiquidacion) Ejecutar(ctx context.Context, liquidacionID, aprobadoPor, empresaID string) error {
	if err := c.repo.AprobarLiquidacion(ctx, liquidacionID, aprobadoPor); err != nil {
		return err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: aprobadoPor, EmpresaID: empresaID,
		Entidad: "liquidacion", EntidadID: liquidacionID, Accion: "ACTUALIZAR",
		Detalle: map[string]any{"nuevo_estado": "APROBADA"},
	})
	return nil
}

type CasoUsoPagarLiquidacion struct {
	repo      comisiones.RepositorioComision
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoPagarLiquidacion(repo comisiones.RepositorioComision, aud auditoria.Auditoria) *CasoUsoPagarLiquidacion {
	return &CasoUsoPagarLiquidacion{repo: repo, auditoria: aud}
}

func (c *CasoUsoPagarLiquidacion) Ejecutar(ctx context.Context, liquidacionID, pagadoPor, empresaID string) error {
	if err := c.repo.PagarLiquidacion(ctx, liquidacionID, pagadoPor); err != nil {
		return err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: pagadoPor, EmpresaID: empresaID,
		Entidad: "liquidacion", EntidadID: liquidacionID, Accion: "ACTUALIZAR",
		Detalle: map[string]any{"nuevo_estado": "PAGADA"},
	})
	return nil
}
