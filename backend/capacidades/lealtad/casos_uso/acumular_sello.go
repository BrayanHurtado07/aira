package casos_uso

import (
	"context"

	"aira/capacidades/lealtad/sellos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudAcumularSello struct {
	EmpresaID     string `json:"empresa_id"`
	ClienteID     string `json:"cliente_id"`
	ReservaID     string `json:"reserva_id"`
	RegistradoPor string `json:"-"`
}

type RespuestaAcumularSello struct {
	SelloID string
}

type CasoUsoAcumularSello struct {
	repositorio sellos.RepositorioSello
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoAcumularSello(
	repo sellos.RepositorioSello,
	aud auditoria.Auditoria,
) *CasoUsoAcumularSello {
	return &CasoUsoAcumularSello{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoAcumularSello) Ejecutar(
	ctx context.Context,
	solicitud SolicitudAcumularSello,
) (RespuestaAcumularSello, error) {
	id, err := c.repositorio.Acumular(ctx,
		solicitud.EmpresaID,
		solicitud.ClienteID,
		solicitud.ReservaID,
		solicitud.RegistradoPor,
	)
	if err != nil {
		return RespuestaAcumularSello{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.RegistradoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "sello",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"id_cliente": solicitud.ClienteID, "id_reserva": solicitud.ReservaID},
	})

	return RespuestaAcumularSello{SelloID: id}, nil
}
