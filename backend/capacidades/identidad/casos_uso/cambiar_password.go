package casos_uso

import (
	"context"

	"aira/capacidades/identidad/sesiones"
	"aira/capacidades/identidad/usuarios"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
	"golang.org/x/crypto/bcrypt"
)

type SolicitudCambiarPassword struct {
	UsuarioID      string
	PasswordActual string
	PasswordNueva  string
	EmpresaID      string
}

type CasoUsoCambiarPassword struct {
	repositorio usuarios.RepositorioUsuario
	sesiones    sesiones.RepositorioSesion
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCambiarPassword(
	repo usuarios.RepositorioUsuario,
	ses sesiones.RepositorioSesion,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCambiarPassword {
	return &CasoUsoCambiarPassword{repositorio: repo, sesiones: ses, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCambiarPassword) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCambiarPassword,
) error {
	usuario, err := c.repositorio.ObtenerPorID(ctx, solicitud.UsuarioID)
	if err != nil {
		return errores.ErrIdentidadNoExiste
	}

	if err := usuario.ValidarEstaActivo(); err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.HashPassword), []byte(solicitud.PasswordActual)); err != nil {
		return errores.ErrCredencialesInvalidas
	}

	nuevoHash, err := bcrypt.GenerateFromPassword([]byte(solicitud.PasswordNueva), bcrypt.DefaultCost)
	if err != nil {
		return errores.ErrOperacionFallida
	}

	if err := c.repositorio.CambiarPassword(ctx, solicitud.UsuarioID, string(nuevoHash)); err != nil {
		return err
	}

	// Política gatillo: password_cambiado → sesiones_invalidadas_por_password
	cantidad, _ := c.sesiones.InvalidarPorUsuario(ctx, solicitud.UsuarioID)

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.UsuarioID,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "usuario",
		EntidadID: solicitud.UsuarioID,
		Accion:    "ACTUALIZAR",
		Detalle:   map[string]any{"campo": "contrasena_hash", "sesiones_invalidadas": cantidad},
	})

	c.publicador.Publicar(ctx, eventos.PasswordCambiado(solicitud.UsuarioID, solicitud.EmpresaID))
	c.publicador.Publicar(ctx, eventos.SesionesInvalidadasPorPassword(solicitud.UsuarioID, cantidad))

	return nil
}
