package casos_uso

import (
	"context"

	"aira/capacidades/notificaciones/plantillas"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudCrearPlantilla struct {
	EmpresaID          string `json:"empresa_id"`
	Nombre             string `json:"nombre"`
	Canal              string `json:"canal"` // WHATSAPP | EMAIL
	ContenidoPlantilla string `json:"contenido_plantilla"`
	CreadoPor          string `json:"-"`
}

type RespuestaCrearPlantilla struct {
	PlantillaID string `json:"plantilla_id"`
}

type CasoUsoCrearPlantilla struct {
	repositorio plantillas.RepositorioPlantilla
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCrearPlantilla(
	repo plantillas.RepositorioPlantilla,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCrearPlantilla {
	return &CasoUsoCrearPlantilla{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

var canalesValidos = map[string]bool{"WHATSAPP": true, "EMAIL": true}

func (c *CasoUsoCrearPlantilla) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCrearPlantilla,
) (RespuestaCrearPlantilla, error) {
	if err := c.validador.ValidarPermiso(
		ctx, solicitud.CreadoPor, solicitud.EmpresaID,
		permisos.PlantillaGestionar,
	); err != nil {
		return RespuestaCrearPlantilla{}, err
	}

	if solicitud.Nombre == "" || solicitud.ContenidoPlantilla == "" {
		return RespuestaCrearPlantilla{}, errores.ErrCampoRequerido
	}
	if !canalesValidos[solicitud.Canal] {
		return RespuestaCrearPlantilla{}, errores.ErrCanalInvalido
	}

	plantilla := plantillas.PlantillaMensaje{
		EmpresaID:          solicitud.EmpresaID,
		Nombre:             solicitud.Nombre,
		Canal:              solicitud.Canal,
		ContenidoPlantilla: solicitud.ContenidoPlantilla,
		Estado:             plantillas.EstadoPlantillaActiva,
	}

	id, err := c.repositorio.Guardar(ctx, plantilla)
	if err != nil {
		return RespuestaCrearPlantilla{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "plantilla_mensaje",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"nombre": solicitud.Nombre, "canal": solicitud.Canal},
	})

	c.publicador.Publicar(ctx, eventos.PlantillaMensajeCreada(id, solicitud.EmpresaID, solicitud.Nombre, solicitud.CreadoPor))

	return RespuestaCrearPlantilla{PlantillaID: id}, nil
}
