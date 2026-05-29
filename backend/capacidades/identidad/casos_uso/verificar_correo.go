package casos_uso

import (
	"context"

	"aira/capacidades/identidad/verificaciones"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
	"aira/plataforma/identidad"
)

type SolicitudVerificarCorreo struct {
	UsuarioID string `json:"usuario_id"`
	Codigo    string `json:"codigo"`
}

type CasoUsoVerificarCorreo struct {
	repoVerificacion verificaciones.RepositorioVerificacion
	publicador       eventos.PublicadorEventos
	auditoria        auditoria.Auditoria
}

func NuevoCasoUsoVerificarCorreo(
	rv verificaciones.RepositorioVerificacion,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoVerificarCorreo {
	return &CasoUsoVerificarCorreo{
		repoVerificacion: rv,
		publicador:       pub,
		auditoria:        aud,
	}
}

func (c *CasoUsoVerificarCorreo) Ejecutar(ctx context.Context, s SolicitudVerificarCorreo) error {
	if s.UsuarioID == "" || s.Codigo == "" {
		return errores.ErrCodigoInvalidoOExpirado
	}

	codigoHash := identidad.HashToken(s.Codigo)

	if err := c.repoVerificacion.VerificarCorreo(ctx, s.UsuarioID, codigoHash); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.UsuarioID,
		Entidad:   "usuario",
		EntidadID: s.UsuarioID,
		Accion:    "VERIFICAR_CORREO",
	})

	c.publicador.Publicar(ctx, eventos.CorreoVerificado(s.UsuarioID))

	return nil
}
