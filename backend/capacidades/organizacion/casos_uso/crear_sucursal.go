package casos_uso

import (
	"context"

	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/capacidades/organizacion/barberias"
	"aira/capacidades/organizacion/sedes"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudCrearSucursal struct {
	EmpresaID string `json:"-"`
	Nombre    string `json:"nombre"`
	Direccion string `json:"direccion"`
	CreadoPor string `json:"-"`
}

type RespuestaCrearSucursal struct {
	SucursalID string
}

type CasoUsoCrearSucursal struct {
	empresas   barberias.RepositorioEmpresa
	sucursales sedes.RepositorioSucursal
	validador  contratosGobierno.ValidadorPermiso
	publicador eventos.PublicadorEventos
	auditoria  auditoria.Auditoria
}

func NuevoCasoUsoCrearSucursal(
	emp barberias.RepositorioEmpresa,
	suc sedes.RepositorioSucursal,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCrearSucursal {
	return &CasoUsoCrearSucursal{empresas: emp, sucursales: suc, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCrearSucursal) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCrearSucursal,
) (RespuestaCrearSucursal, error) {
	if err := c.validador.ValidarPermiso(ctx, solicitud.CreadoPor, solicitud.EmpresaID, permisos.SedeCrear); err != nil {
		return RespuestaCrearSucursal{}, err
	}

	empresa, err := c.empresas.ObtenerActiva(ctx, solicitud.EmpresaID)
	if err != nil {
		return RespuestaCrearSucursal{}, errores.ErrEmpresaNoActiva
	}

	if err := empresa.ValidarEstaActiva(); err != nil {
		return RespuestaCrearSucursal{}, err
	}

	sucursal := sedes.Sucursal{
		EmpresaID: solicitud.EmpresaID,
		Nombre:    solicitud.Nombre,
		Direccion: solicitud.Direccion,
		Estado:    sedes.EstadoSucursalActiva,
	}

	id, err := c.sucursales.Guardar(ctx, sucursal)
	if err != nil {
		return RespuestaCrearSucursal{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "sucursal",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"nombre": solicitud.Nombre},
	})

	c.publicador.Publicar(ctx, eventos.SedeCreada(id, solicitud.EmpresaID, solicitud.Nombre, solicitud.CreadoPor))

	return RespuestaCrearSucursal{SucursalID: id}, nil
}
