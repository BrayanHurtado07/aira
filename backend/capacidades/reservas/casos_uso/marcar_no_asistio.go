package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/reservas"
	"aira/plataforma/gobierno/auditoria"
)

// CasoUsoMarcarNoAsistio marca una reserva CONFIRMADA como NO_ASISTIO (el cliente no llegó).
// La transición de estado la valida la función de dominio reserva_marcar_no_asistio.
type CasoUsoMarcarNoAsistio struct {
	repositorio reservas.RepositorioReserva
	validador   contratosGobierno.ValidadorPermiso
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoMarcarNoAsistio(
	repo reservas.RepositorioReserva,
	val contratosGobierno.ValidadorPermiso,
	aud auditoria.Auditoria,
) *CasoUsoMarcarNoAsistio {
	return &CasoUsoMarcarNoAsistio{repositorio: repo, validador: val, auditoria: aud}
}

func (c *CasoUsoMarcarNoAsistio) Ejecutar(ctx context.Context, reservaID, marcadoPor, empresaID string) error {
	if err := c.validador.ValidarPermiso(ctx, marcadoPor, empresaID, permisos.ReservaCompletar); err != nil {
		return err
	}

	if err := c.repositorio.MarcarNoAsistio(ctx, reservaID, marcadoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: marcadoPor,
		EmpresaID: empresaID,
		Entidad:   "reserva",
		EntidadID: reservaID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nuevo_estado": "NO_ASISTIO"},
	})

	return nil
}
