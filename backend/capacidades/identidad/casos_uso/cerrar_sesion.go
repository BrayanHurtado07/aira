package casos_uso

import (
	"context"

	"aira/capacidades/identidad/sesiones"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type CasoUsoCerrarSesion struct {
	sesiones   sesiones.RepositorioSesion
	publicador eventos.PublicadorEventos
	auditoria  auditoria.Auditoria
}

func NuevoCasoUsoCerrarSesion(
	ses sesiones.RepositorioSesion,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCerrarSesion {
	return &CasoUsoCerrarSesion{sesiones: ses, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCerrarSesion) Ejecutar(ctx context.Context, sesionID, usuarioID, empresaID string) error {
	if err := c.sesiones.Revocar(ctx, sesionID); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: usuarioID,
		EmpresaID: empresaID,
		Entidad:   "sesion_global",
		EntidadID: sesionID,
		Accion:    "CERRAR_SESION",
	})

	c.publicador.Publicar(ctx, eventos.SesionRevocada(sesionID, usuarioID, empresaID))

	return nil
}
