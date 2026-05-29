package casos_uso

import (
	"context"

	"aira/capacidades/identidad/sesiones"
	"aira/capacidades/identidad/usuarios"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoInactivarUsuario struct {
	repositorio usuarios.RepositorioUsuario
	sesiones    sesiones.RepositorioSesion
	validador   contratosGobierno.ValidadorPermiso
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoInactivarUsuario(
	repo usuarios.RepositorioUsuario,
	ses sesiones.RepositorioSesion,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoInactivarUsuario {
	return &CasoUsoInactivarUsuario{repositorio: repo, sesiones: ses, validador: val, publicador: pub, auditoria: aud}
}

func (c *CasoUsoInactivarUsuario) Ejecutar(
	ctx context.Context,
	usuarioID, inactivadoPor, empresaID string,
) error {
	if err := c.validador.ValidarPermiso(ctx, inactivadoPor, empresaID, permisos.UsuarioInactivar); err != nil {
		return err
	}

	usuario, err := c.repositorio.ObtenerPorID(ctx, usuarioID)
	if err != nil {
		return errores.ErrIdentidadNoExiste
	}

	if err := usuario.ValidarEstaActivo(); err != nil {
		return err
	}

	if err := c.repositorio.Inactivar(ctx, usuarioID); err != nil {
		return err
	}

	// Política gatillo: usuario_inactivado → sesiones_invalidadas_por_inactivacion
	cantidad, _ := c.sesiones.InvalidarPorUsuario(ctx, usuarioID)

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: inactivadoPor,
		EmpresaID: empresaID,
		Entidad:   "usuario",
		EntidadID: usuarioID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"nuevo_estado": "INACTIVO", "sesiones_invalidadas": cantidad},
	})

	c.publicador.Publicar(ctx, eventos.UsuarioInactivado(usuarioID, inactivadoPor, empresaID))
	c.publicador.Publicar(ctx, eventos.SesionesInvalidadasPorInactivacion(usuarioID, cantidad))

	return nil
}
