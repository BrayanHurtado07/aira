package casos_uso

import (
	"context"

	"aira/capacidades/reservas/lista_espera"
	"aira/plataforma/gobierno/auditoria"
)

// CasoUsoPromoverListaEspera mueve una entrada ESPERANDO → NOTIFICADO cuando se
// libera un cupo (se avisó al cliente). La transición la valida la función de dominio.
type CasoUsoPromoverListaEspera struct {
	repositorio lista_espera.RepositorioListaEspera
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoPromoverListaEspera(
	repo lista_espera.RepositorioListaEspera,
	aud auditoria.Auditoria,
) *CasoUsoPromoverListaEspera {
	return &CasoUsoPromoverListaEspera{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoPromoverListaEspera) Ejecutar(ctx context.Context, listaEsperaID, marcadoPor, empresaID string) error {
	if err := c.repositorio.Promover(ctx, listaEsperaID, marcadoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: marcadoPor,
		EmpresaID: empresaID,
		Entidad:   "lista_espera",
		EntidadID: listaEsperaID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nuevo_estado": "NOTIFICADO"},
	})

	return nil
}
