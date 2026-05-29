package casos_uso

import (
	"context"

	"aira/capacidades/gobierno_acceso/permisos"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/inventario/productos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudCrearProducto struct {
	EmpresaID      string  `json:"empresa_id"`
	Nombre         string  `json:"nombre"`
	Codigo         string  `json:"codigo"`
	Tipo           string  `json:"tipo"`
	PrecioUnitario float64 `json:"precio_unitario"`
	Descripcion    string  `json:"descripcion"`
	CreadoPor      string  `json:"-"`
}

type RespuestaCrearProducto struct {
	ProductoID string `json:"producto_id"`
}

type CasoUsoCrearProducto struct {
	repositorio productos.RepositorioProducto
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCrearProducto(
	repo productos.RepositorioProducto,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCrearProducto {
	return &CasoUsoCrearProducto{repositorio: repo, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCrearProducto) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCrearProducto,
) (RespuestaCrearProducto, error) {
	if err := c.validador.ValidarPermiso(
		ctx, solicitud.CreadoPor, solicitud.EmpresaID,
		permisos.InventarioGestionar,
	); err != nil {
		return RespuestaCrearProducto{}, err
	}

	if solicitud.Nombre == "" || solicitud.Codigo == "" {
		return RespuestaCrearProducto{}, errores.ErrCampoRequerido
	}
	if !productos.TiposValidos[solicitud.Tipo] {
		return RespuestaCrearProducto{}, errores.ErrTipoProductoInvalido
	}
	if solicitud.PrecioUnitario < 0 {
		return RespuestaCrearProducto{}, errores.ErrPrecioInvalido
	}

	producto := productos.Producto{
		EmpresaID:      solicitud.EmpresaID,
		Nombre:         solicitud.Nombre,
		Codigo:         solicitud.Codigo,
		Tipo:           solicitud.Tipo,
		PrecioUnitario: solicitud.PrecioUnitario,
		Descripcion:    solicitud.Descripcion,
	}

	id, err := c.repositorio.Crear(ctx, producto)
	if err != nil {
		return RespuestaCrearProducto{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "producto",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"nombre": solicitud.Nombre,
			"codigo": solicitud.Codigo,
			"tipo":   solicitud.Tipo,
		},
	})

	c.publicador.Publicar(ctx, eventos.ProductoCreado(id, solicitud.EmpresaID, solicitud.Nombre, solicitud.CreadoPor))

	return RespuestaCrearProducto{ProductoID: id}, nil
}
