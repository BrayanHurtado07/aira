package casos_uso

import (
	"context"
	"strings"

	"aira/capacidades/canal_whatsapp/atajos"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
)

type SolicitudCrearAtajo struct {
	Titulo    string `json:"titulo"`
	Contenido string `json:"contenido"`
	Orden     int    `json:"orden"`
	EmpresaID string `json:"-"`
	CreadoPor string `json:"-"`
}

type RespuestaCrearAtajo struct {
	AtajoID string `json:"atajo_id"`
}

type CasoUsoCrearAtajo struct {
	repositorio atajos.RepositorioAtajo
	validador   contratosGobierno.ValidadorPermiso
}

func NuevoCasoUsoCrearAtajo(
	repo atajos.RepositorioAtajo,
	val contratosGobierno.ValidadorPermiso,
) *CasoUsoCrearAtajo {
	return &CasoUsoCrearAtajo{repositorio: repo, validador: val}
}

func (c *CasoUsoCrearAtajo) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCrearAtajo,
) (RespuestaCrearAtajo, error) {
	if err := c.validador.ValidarPermiso(
		ctx, solicitud.CreadoPor, solicitud.EmpresaID,
		permisos.CanalGestionar,
	); err != nil {
		return RespuestaCrearAtajo{}, err
	}

	if strings.TrimSpace(solicitud.Titulo) == "" || strings.TrimSpace(solicitud.Contenido) == "" {
		return RespuestaCrearAtajo{}, errores.ErrAtajoInvalido
	}

	atajo := atajos.Atajo{
		EmpresaID: solicitud.EmpresaID,
		Titulo:    strings.TrimSpace(solicitud.Titulo),
		Contenido: solicitud.Contenido,
		Orden:     solicitud.Orden,
	}

	id, err := c.repositorio.Crear(ctx, atajo, solicitud.CreadoPor)
	if err != nil {
		return RespuestaCrearAtajo{}, err
	}

	return RespuestaCrearAtajo{AtajoID: id}, nil
}
