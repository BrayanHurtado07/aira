package casos_uso

import (
	"context"

	"aira/capacidades/identidad/usuarios"
	"aira/capacidades/identidad/verificaciones"
	"aira/compartido/errores"
	"aira/plataforma/correo"
	"aira/plataforma/gobierno/auditoria"
	"aira/plataforma/identidad"

	"github.com/google/uuid"
)

type SolicitudSolicitarVerificacionCorreo struct {
	Correo string `json:"correo_electronico"`
}

type CasoUsoSolicitarVerificacionCorreo struct {
	repoUsuario      usuarios.RepositorioUsuario
	repoVerificacion verificaciones.RepositorioVerificacion
	notificador      correo.NotificadorCorreo
	auditoria        auditoria.Auditoria
}

func NuevoCasoUsoSolicitarVerificacionCorreo(
	ru usuarios.RepositorioUsuario,
	rv verificaciones.RepositorioVerificacion,
	not correo.NotificadorCorreo,
	aud auditoria.Auditoria,
) *CasoUsoSolicitarVerificacionCorreo {
	return &CasoUsoSolicitarVerificacionCorreo{
		repoUsuario:      ru,
		repoVerificacion: rv,
		notificador:      not,
		auditoria:        aud,
	}
}

func (c *CasoUsoSolicitarVerificacionCorreo) Ejecutar(
	ctx context.Context,
	s SolicitudSolicitarVerificacionCorreo,
) error {
	if s.Correo == "" {
		return errores.ErrIdentidadNoExiste
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

	_ = c.notificador.EnviarCodigoVerificacion(ctx, usuario.Correo, usuario.Nombre, codigoPlano)

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: usuario.ID,
		Entidad:   "verificacion_correo_electronico",
		EntidadID: usuario.ID,
		Accion:    "CREAR",
		Detalle:   map[string]any{"correo": s.Correo},
	})

	return nil
}
