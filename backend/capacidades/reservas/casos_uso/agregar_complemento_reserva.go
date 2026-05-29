package casos_uso

import (
	"context"

	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudAgregarComplementoReserva struct {
	ReservaID     string  `json:"reserva_id"`
	ProductoID    string  `json:"producto_id"`
	Cantidad      float64 `json:"cantidad"`
	RegistradoPor string  `json:"-"`
	EmpresaID     string  `json:"-"`
}

// RepositorioComplementoReserva define las operaciones sobre complemento_reserva.
type RepositorioComplementoReserva interface {
	Agregar(ctx context.Context, reservaID, productoID string, cantidad float64, registradoPor string) error
	ListarPorReserva(ctx context.Context, reservaID string) ([]ComplementoReservaItem, error)
}

// ComplementoReservaItem es la vista de un producto agregado a una reserva.
type ComplementoReservaItem struct {
	ProductoID     string  `json:"producto_id"`
	NombreProducto string  `json:"nombre_producto"`
	Cantidad       float64 `json:"cantidad"`
}

type CasoUsoAgregarComplementoReserva struct {
	repositorio RepositorioComplementoReserva
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoAgregarComplementoReserva(
	repo RepositorioComplementoReserva,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoAgregarComplementoReserva {
	return &CasoUsoAgregarComplementoReserva{repositorio: repo, publicador: pub, auditoria: aud}
}

func (c *CasoUsoAgregarComplementoReserva) Ejecutar(
	ctx context.Context,
	solicitud SolicitudAgregarComplementoReserva,
) error {
	if solicitud.ReservaID == "" || solicitud.ProductoID == "" {
		return errores.ErrHorarioInvalido
	}
	if solicitud.Cantidad <= 0 {
		return errores.ErrCantidadInvalida
	}

	if err := c.repositorio.Agregar(ctx, solicitud.ReservaID, solicitud.ProductoID, solicitud.Cantidad, solicitud.RegistradoPor); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.RegistradoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "complemento_reserva",
		EntidadID: solicitud.ReservaID,
		Accion:    "ACTUALIZAR",
		Detalle: map[string]any{
			"producto_id": solicitud.ProductoID,
			"cantidad":    solicitud.Cantidad,
		},
	})

	c.publicador.Publicar(ctx, eventos.ComplementoReservaAgregado(solicitud.ReservaID, solicitud.ProductoID, solicitud.RegistradoPor))

	return nil
}
