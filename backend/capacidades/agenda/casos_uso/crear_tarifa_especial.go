package casos_uso

import (
	"context"

	"aira/capacidades/agenda/tarifas"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudCrearTarifaEspecial struct {
	SucursalID     string  `json:"sucursal_id"`
	ServicioID     string  `json:"servicio_id"`
	Fecha          string  `json:"fecha"`
	PrecioEspecial float64 `json:"precio_especial"`
	Motivo         string  `json:"motivo"`
	CreadoPor      string  `json:"-"`
	EmpresaID      string  `json:"-"`
}

type RespuestaCrearTarifaEspecial struct {
	TarifaID string `json:"tarifa_id"`
}

type CasoUsoCrearTarifaEspecial struct {
	repositorio tarifas.RepositorioTarifaEspecial
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCrearTarifaEspecial(
	repo tarifas.RepositorioTarifaEspecial,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCrearTarifaEspecial {
	return &CasoUsoCrearTarifaEspecial{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCrearTarifaEspecial) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCrearTarifaEspecial,
) (RespuestaCrearTarifaEspecial, error) {
	if err := c.validador.ValidarPermiso(
		ctx, solicitud.CreadoPor, solicitud.EmpresaID,
		permisos.TarifaEspecialCrear,
	); err != nil {
		return RespuestaCrearTarifaEspecial{}, err
	}

	if solicitud.Fecha == "" || solicitud.SucursalID == "" || solicitud.ServicioID == "" {
		return RespuestaCrearTarifaEspecial{}, errores.ErrHorarioInvalido
	}
	if solicitud.PrecioEspecial < 0 {
		return RespuestaCrearTarifaEspecial{}, errores.ErrPrecioInvalido
	}

	tarifa := tarifas.TarifaEspecial{
		SucursalID:     solicitud.SucursalID,
		ServicioID:     solicitud.ServicioID,
		Fecha:          solicitud.Fecha,
		PrecioEspecial: solicitud.PrecioEspecial,
		Motivo:         solicitud.Motivo,
	}

	id, err := c.repositorio.Crear(ctx, tarifa, solicitud.CreadoPor)
	if err != nil {
		return RespuestaCrearTarifaEspecial{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "tarifa_especial",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"sucursal_id":     solicitud.SucursalID,
			"servicio_id":     solicitud.ServicioID,
			"fecha":           solicitud.Fecha,
			"precio_especial": solicitud.PrecioEspecial,
		},
	})

	c.publicador.Publicar(ctx, eventos.TarifaEspecialCreada(
		id, solicitud.SucursalID, solicitud.ServicioID,
		solicitud.Fecha, solicitud.CreadoPor,
	))

	return RespuestaCrearTarifaEspecial{TarifaID: id}, nil
}
