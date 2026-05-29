package casos_uso

import (
	"context"

	"aira/capacidades/identidad/usuarios"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
	"golang.org/x/crypto/bcrypt"
)

type SolicitudRegistrarUsuario struct {
	Nombre   string `json:"nombre"`
	Correo   string `json:"correo_electronico"`
	Password string `json:"contrasena"`
}

type RespuestaRegistrarUsuario struct {
	UsuarioID string
}

type CasoUsoRegistrarUsuario struct {
	repositorio usuarios.RepositorioUsuario
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoRegistrarUsuario(
	repo usuarios.RepositorioUsuario,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRegistrarUsuario {
	return &CasoUsoRegistrarUsuario{repositorio: repo, publicador: pub, auditoria: aud}
}

func (c *CasoUsoRegistrarUsuario) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRegistrarUsuario,
) (RespuestaRegistrarUsuario, error) {
	_, err := c.repositorio.ObtenerPorCorreo(ctx, solicitud.Correo)
	if err == nil {
		return RespuestaRegistrarUsuario{}, errores.ErrCorreoYaRegistrado
	}
	if err != errores.ErrIdentidadNoExiste {
		return RespuestaRegistrarUsuario{}, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(solicitud.Password), bcrypt.DefaultCost)
	if err != nil {
		return RespuestaRegistrarUsuario{}, errores.ErrOperacionFallida
	}

	usuario := usuarios.Usuario{
		Nombre: solicitud.Nombre,
		Correo: solicitud.Correo,
		Estado: usuarios.EstadoUsuarioActivo,
	}

	id, err := c.repositorio.Guardar(ctx, usuario, string(hash))
	if err != nil {
		return RespuestaRegistrarUsuario{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: id,
		Entidad:   "usuario",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"correo": solicitud.Correo},
	})

	c.publicador.Publicar(ctx, eventos.UsuarioRegistrado(id, solicitud.Correo))

	return RespuestaRegistrarUsuario{UsuarioID: id}, nil
}
