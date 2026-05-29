package casos_uso

import (
	"context"

	"aira/capacidades/reservas/clientes"
	"aira/compartido/errores"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudRegistrarCliente struct {
	EmpresaID         string `json:"empresa_id"`
	Nombre            string `json:"nombre"`
	Telefono          string `json:"telefono"`
	CorreoElectronico string `json:"correo_electronico"`
	CreadoPor         string `json:"-"`
}

type RespuestaRegistrarCliente struct {
	ClienteID string `json:"cliente_id"`
	YaExistia bool   `json:"ya_existia"`
}

type CasoUsoRegistrarCliente struct {
	repositorio clientes.RepositorioCliente
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoRegistrarCliente(
	repo clientes.RepositorioCliente,
	aud auditoria.Auditoria,
) *CasoUsoRegistrarCliente {
	return &CasoUsoRegistrarCliente{repositorio: repo, auditoria: aud}
}

func (c *CasoUsoRegistrarCliente) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRegistrarCliente,
) (RespuestaRegistrarCliente, error) {
	existente, err := c.repositorio.ObtenerPorTelefono(ctx, solicitud.EmpresaID, solicitud.Telefono)
	if err == nil {
		return RespuestaRegistrarCliente{ClienteID: existente.ID, YaExistia: true}, nil
	}
	if err != errores.ErrClienteNoExiste {
		return RespuestaRegistrarCliente{}, err
	}

	cliente := clientes.Cliente{
		EmpresaID: solicitud.EmpresaID,
		Nombre:    solicitud.Nombre,
		Telefono:  solicitud.Telefono,
		Correo:    solicitud.CorreoElectronico,
		Estado:    clientes.EstadoClienteActivo,
	}

	id, err := c.repositorio.Guardar(ctx, cliente)
	if err != nil {
		return RespuestaRegistrarCliente{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "cliente",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"nombre": solicitud.Nombre, "telefono": solicitud.Telefono},
	})

	return RespuestaRegistrarCliente{ClienteID: id, YaExistia: false}, nil
}
