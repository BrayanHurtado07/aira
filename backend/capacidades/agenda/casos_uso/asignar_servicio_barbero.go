package casos_uso

import (
	"context"

	"aira/capacidades/agenda/barberos"
	"aira/capacidades/agenda/servicios"
	"aira/compartido/errores"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudAsignarServicioBarbero struct {
	BarberoID  string
	ServicioID string
	EmpresaID  string
	AsignadoPor string
}

type CasoUsoAsignarServicioBarbero struct {
	barberos    barberos.RepositorioBarbero
	servicios   servicios.RepositorioServicio
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoAsignarServicioBarbero(
	barb barberos.RepositorioBarbero,
	serv servicios.RepositorioServicio,
	aud auditoria.Auditoria,
) *CasoUsoAsignarServicioBarbero {
	return &CasoUsoAsignarServicioBarbero{barberos: barb, servicios: serv, auditoria: aud}
}

func (c *CasoUsoAsignarServicioBarbero) Ejecutar(
	ctx context.Context,
	solicitud SolicitudAsignarServicioBarbero,
) error {
	barbero, err := c.barberos.ObtenerActivo(ctx, solicitud.BarberoID)
	if err != nil {
		return errores.ErrBarberoNoActivo
	}
	if !barbero.PerteneceAEmpresa(solicitud.EmpresaID) {
		return errores.ErrBarberoFueraDeSede
	}

	servicio, err := c.servicios.ObtenerActivo(ctx, solicitud.ServicioID)
	if err != nil {
		return errores.ErrServicioNoActivo
	}
	if servicio.EmpresaID != solicitud.EmpresaID {
		return errores.ErrServicioNoActivo
	}

	if err := c.barberos.AsignarServicio(ctx, solicitud.BarberoID, solicitud.ServicioID); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.AsignadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "barbero_servicio",
		EntidadID: solicitud.BarberoID,
		Accion:    "CREAR",
		Detalle:   map[string]any{"id_servicio": solicitud.ServicioID},
	})

	return nil
}
