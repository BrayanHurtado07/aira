package casos_uso

import (
	"context"

	"aira/capacidades/agenda/barberos"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudDesasignarServicioBarbero struct {
	BarberoID   string `json:"barbero_id"`
	ServicioID  string `json:"servicio_id"`
	EmpresaID   string `json:"-"`
	AsignadoPor string `json:"-"`
}

type CasoUsoDesasignarServicioBarbero struct {
	repositorio barberos.RepositorioBarbero
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoDesasignarServicioBarbero(
	repo barberos.RepositorioBarbero,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoDesasignarServicioBarbero {
	return &CasoUsoDesasignarServicioBarbero{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoDesasignarServicioBarbero) Ejecutar(ctx context.Context, s SolicitudDesasignarServicioBarbero) error {
	if err := c.validador.ValidarPermiso(ctx, s.AsignadoPor, s.EmpresaID, permisos.BarberoServicioAsignar); err != nil {
		return err
	}

	barbero, err := c.repositorio.ObtenerActivo(ctx, s.BarberoID)
	if err != nil {
		return errores.ErrBarberoNoActivo
	}

	if !barbero.PerteneceAEmpresa(s.EmpresaID) {
		return errores.ErrPermisoDenegado
	}

	if err := c.repositorio.DesasignarServicio(ctx, s.BarberoID, s.ServicioID); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.AsignadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "barbero",
		EntidadID: s.BarberoID,
		Accion:    "DESASIGNAR_SERVICIO",
		Detalle:   map[string]any{"servicio_id": s.ServicioID},
	})

	c.publicador.Publicar(ctx, eventos.ServicioDesasignado(s.BarberoID, s.ServicioID, s.EmpresaID, s.AsignadoPor))

	return nil
}
