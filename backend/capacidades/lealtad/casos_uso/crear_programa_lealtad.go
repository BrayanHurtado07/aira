package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/lealtad/programas"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudCrearProgramaLealtad struct {
	EmpresaID             string  `json:"empresa_id"`
	Nombre                string  `json:"nombre"`
	SellosParaRecompensa  int     `json:"sellos_para_recompensa"`
	DescripcionRecompensa string  `json:"descripcion_recompensa"`
	CreadoPor             string  `json:"-"`
}

type RespuestaCrearProgramaLealtad struct {
	ProgramaID string
}

type CasoUsoCrearProgramaLealtad struct {
	repositorio programas.RepositorioPrograma
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCrearProgramaLealtad(
	repo programas.RepositorioPrograma,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCrearProgramaLealtad {
	return &CasoUsoCrearProgramaLealtad{
		repositorio: repo,
		validador:   val,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoCrearProgramaLealtad) Ejecutar(
	ctx context.Context,
	s SolicitudCrearProgramaLealtad,
) (RespuestaCrearProgramaLealtad, error) {
	if err := c.validador.ValidarPermiso(ctx, s.CreadoPor, s.EmpresaID, permisos.ProgramaLealtadGestionar); err != nil {
		return RespuestaCrearProgramaLealtad{}, err
	}

	if s.Nombre == "" {
		return RespuestaCrearProgramaLealtad{}, errores.ErrOperacionFallida
	}

	if s.SellosParaRecompensa <= 0 {
		return RespuestaCrearProgramaLealtad{}, errores.ErrSellosInvalidos
	}

	id, err := c.repositorio.Crear(ctx,
		s.EmpresaID,
		s.Nombre,
		s.SellosParaRecompensa,
		s.DescripcionRecompensa,
		s.CreadoPor,
	)
	if err != nil {
		return RespuestaCrearProgramaLealtad{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.CreadoPor,
		EmpresaID: s.EmpresaID,
		Entidad:   "programa_lealtad",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"nombre":                  s.Nombre,
			"sellos_para_recompensa":  s.SellosParaRecompensa,
		},
	})

	c.publicador.Publicar(ctx, eventos.ProgramaLealtadCreado(id, s.EmpresaID, s.Nombre, s.CreadoPor))

	return RespuestaCrearProgramaLealtad{ProgramaID: id}, nil
}
