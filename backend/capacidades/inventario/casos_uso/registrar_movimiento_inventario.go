package casos_uso

import (
	"context"

	"aira/capacidades/gobierno_acceso/permisos"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/inventario/movimientos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudRegistrarMovimientoInventario struct {
	ProductoID       string  `json:"producto_id"`
	SucursalID       string  `json:"sucursal_id"`
	ReservaID        string  `json:"reserva_id,omitempty"`
	TipoMovimiento   string  `json:"tipo_movimiento"`
	Cantidad         float64 `json:"cantidad"`
	CausaDescripcion string  `json:"causa_descripcion,omitempty"`
	RegistradoPor    string  `json:"-"`
	EmpresaID        string  `json:"-"`
}

type RespuestaRegistrarMovimientoInventario struct {
	MovimientoID string `json:"movimiento_id"`
}

type CasoUsoRegistrarMovimientoInventario struct {
	repositorio movimientos.RepositorioMovimientoInventario
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoRegistrarMovimientoInventario(
	repo movimientos.RepositorioMovimientoInventario,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRegistrarMovimientoInventario {
	return &CasoUsoRegistrarMovimientoInventario{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoRegistrarMovimientoInventario) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRegistrarMovimientoInventario,
) (RespuestaRegistrarMovimientoInventario, error) {
	if err := c.validador.ValidarPermiso(
		ctx, solicitud.RegistradoPor, solicitud.EmpresaID,
		permisos.InventarioGestionar,
	); err != nil {
		return RespuestaRegistrarMovimientoInventario{}, err
	}

	if !movimientos.TiposMovimientoValidos[solicitud.TipoMovimiento] {
		return RespuestaRegistrarMovimientoInventario{}, errores.ErrTipoMovimientoInvalido
	}
	if solicitud.Cantidad == 0 {
		return RespuestaRegistrarMovimientoInventario{}, errores.ErrCantidadInvalida
	}

	mov := movimientos.MovimientoInventario{
		ProductoID:       solicitud.ProductoID,
		SucursalID:       solicitud.SucursalID,
		ReservaID:        solicitud.ReservaID,
		TipoMovimiento:   solicitud.TipoMovimiento,
		Cantidad:         solicitud.Cantidad,
		CausaDescripcion: solicitud.CausaDescripcion,
	}

	id, err := c.repositorio.Registrar(ctx, mov)
	if err != nil {
		return RespuestaRegistrarMovimientoInventario{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.RegistradoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "movimiento_inventario",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"tipo":     solicitud.TipoMovimiento,
			"cantidad": solicitud.Cantidad,
		},
	})

	c.publicador.Publicar(ctx, eventos.MovimientoInventarioRegistrado(id, solicitud.ProductoID, solicitud.SucursalID, solicitud.TipoMovimiento, solicitud.RegistradoPor))

	return RespuestaRegistrarMovimientoInventario{MovimientoID: id}, nil
}
