package casos_uso

import (
	"context"

	"aira/capacidades/agenda/barberos"
	contratosGobierno "aira/capacidades/gobierno_acceso/contratos"
	"aira/capacidades/gobierno_acceso/permisos"
	contratosIdentidad "aira/capacidades/identidad/contratos"
	"aira/capacidades/organizacion/barberias"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudRegistrarBarbero struct {
	EmpresaID string `json:"empresa_id"`
	Nombre    string `json:"nombre"`
	Telefono  string `json:"telefono"`
	UsuarioID string `json:"usuario_id"`
	FotoURL   string `json:"foto_url"`
	CreadoPor string `json:"-"`
}

type RespuestaRegistrarBarbero struct {
	BarberoID string
}

type CasoUsoRegistrarBarbero struct {
	empresas             barberias.RepositorioEmpresa
	repositorio          barberos.RepositorioBarbero
	verificadorIdentidad contratosIdentidad.VerificadorIdentidad
	validador            contratosGobierno.ValidadorPermiso
	publicador           eventos.PublicadorEventos
	auditoria            auditoria.Auditoria
}

func NuevoCasoUsoRegistrarBarbero(
	emp barberias.RepositorioEmpresa,
	repo barberos.RepositorioBarbero,
	verificador contratosIdentidad.VerificadorIdentidad,
	val contratosGobierno.ValidadorPermiso,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRegistrarBarbero {
	return &CasoUsoRegistrarBarbero{
		empresas:             emp,
		repositorio:          repo,
		verificadorIdentidad: verificador,
		validador:            val,
		publicador:           pub,
		auditoria:            aud,
	}
}

func (c *CasoUsoRegistrarBarbero) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRegistrarBarbero,
) (RespuestaRegistrarBarbero, error) {
	if err := c.validador.ValidarPermiso(ctx, solicitud.CreadoPor, solicitud.EmpresaID, permisos.BarberoRegistrar); err != nil {
		return RespuestaRegistrarBarbero{}, err
	}

	empresa, err := c.empresas.ObtenerActiva(ctx, solicitud.EmpresaID)
	if err != nil {
		return RespuestaRegistrarBarbero{}, errores.ErrEmpresaNoActiva
	}

	if err := empresa.ValidarEstaActiva(); err != nil {
		return RespuestaRegistrarBarbero{}, err
	}

	if solicitud.UsuarioID != "" {
		if err := c.verificadorIdentidad.UsuarioActivo(ctx, solicitud.UsuarioID); err != nil {
			return RespuestaRegistrarBarbero{}, err
		}
	}

	barbero := barberos.Barbero{
		EmpresaID: solicitud.EmpresaID,
		Nombre:    solicitud.Nombre,
		Telefono:  solicitud.Telefono,
		UsuarioID: solicitud.UsuarioID,
		Estado:    barberos.EstadoBarberoActivo,
	}

	id, err := c.repositorio.Guardar(ctx, barbero, solicitud.FotoURL)
	if err != nil {
		return RespuestaRegistrarBarbero{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "barbero",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"nombre": solicitud.Nombre},
	})

	c.publicador.Publicar(ctx, eventos.BarberoRegistrado(id, solicitud.EmpresaID, solicitud.Nombre, solicitud.CreadoPor))

	return RespuestaRegistrarBarbero{BarberoID: id}, nil
}
