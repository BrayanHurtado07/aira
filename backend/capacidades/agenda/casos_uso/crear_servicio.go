package casos_uso

import (
	"context"

	"aira/capacidades/agenda/servicios"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/organizacion/barberias"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudCrearServicio struct {
	EmpresaID       string  `json:"empresa_id"`
	Nombre          string  `json:"nombre"`
	DuracionMinutos int     `json:"duracion_minutos"`
	PrecioBase      float64 `json:"precio,omitempty"`
	Descripcion     string  `json:"descripcion"`
	CreadoPor       string  `json:"-"`
}

type RespuestaCrearServicio struct {
	ServicioID string
}

type CasoUsoCrearServicio struct {
	empresas    barberias.RepositorioEmpresa
	repositorio servicios.RepositorioServicio
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCrearServicio(
	emp barberias.RepositorioEmpresa,
	repo servicios.RepositorioServicio,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCrearServicio {
	return &CasoUsoCrearServicio{empresas: emp, repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCrearServicio) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCrearServicio,
) (RespuestaCrearServicio, error) {
	if err := c.validador.ValidarPermiso(ctx, solicitud.CreadoPor, solicitud.EmpresaID, permisos.ServicioRegistrar); err != nil {
		return RespuestaCrearServicio{}, err
	}

	if solicitud.DuracionMinutos <= 0 {
		return RespuestaCrearServicio{}, errores.ErrHorarioInvalido
	}
	if solicitud.PrecioBase < 0 {
		return RespuestaCrearServicio{}, errores.ErrOperacionFallida
	}

	empresa, err := c.empresas.ObtenerActiva(ctx, solicitud.EmpresaID)
	if err != nil {
		return RespuestaCrearServicio{}, errores.ErrEmpresaNoActiva
	}
	if err := empresa.ValidarEstaActiva(); err != nil {
		return RespuestaCrearServicio{}, err
	}

	servicio := servicios.Servicio{
		EmpresaID:       solicitud.EmpresaID,
		Nombre:          solicitud.Nombre,
		DuracionMinutos: solicitud.DuracionMinutos,
		PrecioBase:      solicitud.PrecioBase,
		Descripcion:     solicitud.Descripcion,
		Estado:          servicios.EstadoServicioActivo,
	}

	id, err := c.repositorio.Guardar(ctx, servicio)
	if err != nil {
		return RespuestaCrearServicio{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "servicio",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"nombre": solicitud.Nombre, "duracion_minutos": solicitud.DuracionMinutos},
	})

	c.publicador.Publicar(ctx, eventos.ServicioRegistrado(id, solicitud.EmpresaID, solicitud.Nombre, solicitud.CreadoPor))

	return RespuestaCrearServicio{ServicioID: id}, nil
}
