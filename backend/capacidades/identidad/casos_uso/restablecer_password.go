package casos_uso

import (
	"context"

	"aira/capacidades/identidad/usuarios"
	"aira/capacidades/identidad/verificaciones"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
	"aira/plataforma/identidad"

	"golang.org/x/crypto/bcrypt"
)

type SolicitudRestablecerPassword struct {
	UsuarioID        string `json:"usuario_id"`
	Codigo           string `json:"codigo"`
	NuevaContrasena  string `json:"nueva_contrasena"`
}

type CasoUsoRestablecerPassword struct {
	repoUsuario      usuarios.RepositorioUsuario
	repoVerificacion verificaciones.RepositorioVerificacion
	publicador       eventos.PublicadorEventos
	auditoria        auditoria.Auditoria
}

func NuevoCasoUsoRestablecerPassword(
	ru usuarios.RepositorioUsuario,
	rv verificaciones.RepositorioVerificacion,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRestablecerPassword {
	return &CasoUsoRestablecerPassword{
		repoUsuario:      ru,
		repoVerificacion: rv,
		publicador:       pub,
		auditoria:        aud,
	}
}

func (c *CasoUsoRestablecerPassword) Ejecutar(ctx context.Context, s SolicitudRestablecerPassword) error {
	if s.UsuarioID == "" || s.Codigo == "" || s.NuevaContrasena == "" {
		return errores.ErrCodigoInvalidoOExpirado
	}

	if len(s.NuevaContrasena) < 8 {
		return errores.ErrCredencialesInvalidas
	}

	codigoHash := identidad.HashToken(s.Codigo)

	// Valida el token y lo marca como usado (sin efecto sobre correo_verificado).
	if err := c.repoVerificacion.ValidarYUsarToken(ctx, s.UsuarioID, codigoHash); err != nil {
		return err
	}

	nuevoHash, err := bcrypt.GenerateFromPassword([]byte(s.NuevaContrasena), bcrypt.DefaultCost)
	if err != nil {
		return errores.ErrOperacionFallida
	}

	if err := c.repoUsuario.CambiarPassword(ctx, s.UsuarioID, string(nuevoHash)); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.UsuarioID,
		Entidad:   "usuario",
		EntidadID: s.UsuarioID,
		Accion:    "RESTABLECER_PASSWORD",
	})

	c.publicador.Publicar(ctx, eventos.PasswordRestablecido(s.UsuarioID))

	return nil
}
