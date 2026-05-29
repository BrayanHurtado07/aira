package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/organizacion/barberias"
	"aira/capacidades/organizacion/periodos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudCrearPeriodo struct {
	EmpresaID   string `json:"-"`
	Nombre      string `json:"nombre"`
	FechaInicio string `json:"fecha_inicio"`
	FechaFin    string `json:"fecha_fin"`
	CreadoPor   string `json:"-"`
}

type RespuestaCrearPeriodo struct {
	PeriodoID string
}

type CasoUsoCrearPeriodo struct {
	empresas    barberias.RepositorioEmpresa
	repositorio periodos.RepositorioPeriodo
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCrearPeriodo(
	emp barberias.RepositorioEmpresa,
	repo periodos.RepositorioPeriodo,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCrearPeriodo {
	return &CasoUsoCrearPeriodo{empresas: emp, repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCrearPeriodo) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCrearPeriodo,
) (RespuestaCrearPeriodo, error) {
	if err := c.validador.ValidarPermiso(ctx, solicitud.CreadoPor, solicitud.EmpresaID, permisos.PeriodoCrear); err != nil {
		return RespuestaCrearPeriodo{}, err
	}

	empresa, err := c.empresas.ObtenerActiva(ctx, solicitud.EmpresaID)
	if err != nil {
		return RespuestaCrearPeriodo{}, errores.ErrEmpresaNoActiva
	}
	if err := empresa.ValidarEstaActiva(); err != nil {
		return RespuestaCrearPeriodo{}, err
	}

	periodo := periodos.Periodo{
		EmpresaID:   solicitud.EmpresaID,
		Nombre:      solicitud.Nombre,
		FechaInicio: solicitud.FechaInicio,
		FechaFin:    solicitud.FechaFin,
		Estado:      periodos.EstadoPeriodoActivo,
	}

	id, err := c.repositorio.Guardar(ctx, periodo)
	if err != nil {
		return RespuestaCrearPeriodo{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "periodo",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"nombre": solicitud.Nombre, "fecha_inicio": solicitud.FechaInicio},
	})

	c.publicador.Publicar(ctx, eventos.PeriodoAbierto(id, solicitud.EmpresaID, solicitud.Nombre, solicitud.CreadoPor))

	return RespuestaCrearPeriodo{PeriodoID: id}, nil
}
