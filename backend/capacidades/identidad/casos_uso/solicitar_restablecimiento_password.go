package casos_uso

import (
	"context"

	"aira/capacidades/identidad/usuarios"
	"aira/capacidades/identidad/verificaciones"
	"aira/plataforma/correo"
	"aira/plataforma/gobierno/auditoria"
	"aira/plataforma/identidad"

	"github.com/google/uuid"
)

type SolicitudSolicitarRestablecimientoPassword struct {
	Correo string `json:"correo_electronico"`
}

type CasoUsoSolicitarRestablecimientoPassword struct {
	repoUsuario      usuarios.RepositorioUsuario
	repoVerificacion verificaciones.RepositorioVerificacion
	notificador      correo.NotificadorCorreo
	auditoria        auditoria.Auditoria
}

func NuevoCasoUsoSolicitarRestablecimientoPassword(
	ru usuarios.RepositorioUsuario,
	rv verificaciones.RepositorioVerificacion,
	not correo.NotificadorCorreo,
	aud auditoria.Auditoria,
) *CasoUsoSolicitarRestablecimientoPassword {
	return &CasoUsoSolicitarRestablecimientoPassword{
		repoUsuario:      ru,
		repoVerificacion: rv,
		notificador:      not,
		auditoria:        aud,
	}
}

func (c *CasoUsoSolicitarRestablecimientoPassword) Ejecutar(
	ctx context.Context,
	s SolicitudSolicitarRestablecimientoPassword,
) error {
	if s.Correo == "" {
		return nil
	}

	usuario, err := c.repoUsuario.ObtenerPorCorreo(ctx, s.Correo)
	// Respuesta silenciosa si no existe: evitar enumeración de correos.
	if err != nil {
		return nil
	}
	if err := usuario.ValidarEstaActivo(); err != nil {
		return nil
	}

	codigoPlano := uuid.New().String()
	codigoHash := identidad.HashToken(codigoPlano)

	if err := c.repoVerificacion.CrearToken(ctx, usuario.ID, codigoHash); err != nil {
		return err
	}

	_ = c.notificador.EnviarCodigoReset(ctx, usuario.Correo, usuario.Nombre, codigoPlano)

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: usuario.ID,
		Entidad:   "usuario",
		EntidadID: usuario.ID,
		Accion:    "SOLICITAR_RESET_PASSWORD",
		Detalle:   map[string]any{"correo": s.Correo},
	})

	return nil
}
