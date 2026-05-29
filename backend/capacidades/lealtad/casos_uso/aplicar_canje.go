package casos_uso

import (
	"context"

	"aira/capacidades/lealtad/sellos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudAplicarCanje struct {
	TarjetaID   string
	ReservaID   string
	SellosAUsar int
	Descripcion string
	EmpresaID   string
	CreadoPor   string
}

type RespuestaAplicarCanje struct {
	CanjeID string
}

type CasoUsoAplicarCanje struct {
	repositorio sellos.RepositorioSello
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoAplicarCanje(
	repo sellos.RepositorioSello,
	aud auditoria.Auditoria,
) *CasoUsoAplicarCanje {
	return &CasoUsoAplicarCanje{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoAplicarCanje) Ejecutar(
	ctx context.Context,
	solicitud SolicitudAplicarCanje,
) (RespuestaAplicarCanje, error) {
	id, err := c.repositorio.AplicarCanje(ctx,
		solicitud.TarjetaID,
		solicitud.ReservaID,
		solicitud.SellosAUsar,
		solicitud.Descripcion,
		solicitud.CreadoPor,
	)
	if err != nil {
		return RespuestaAplicarCanje{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "canje_recompensa",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"sellos_usados": solicitud.SellosAUsar, "id_tarjeta": solicitud.TarjetaID},
	})

	return RespuestaAplicarCanje{CanjeID: id}, nil
}
