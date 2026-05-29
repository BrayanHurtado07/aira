package casos_uso

import (
	"context"

	"aira/capacidades/reservas/lista_espera"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
)

type SolicitudIngresarListaEspera struct {
	EmpresaID        string `json:"empresa_id"`
	ClienteID        string `json:"cliente_id"`
	SucursalID       string `json:"sucursal_id"`
	ServicioID       string `json:"servicio_id"`
	BarberoID        string `json:"barbero_id,omitempty"`
	FechaHoraDeseada string `json:"fecha_hora_deseada"`
	CreadoPor        string `json:"-"`
}

type RespuestaIngresarListaEspera struct {
	ListaEsperaID string `json:"lista_espera_id"`
}

type CasoUsoIngresarListaEspera struct {
	repositorio lista_espera.RepositorioListaEspera
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoIngresarListaEspera(
	repo lista_espera.RepositorioListaEspera,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoIngresarListaEspera {
	return &CasoUsoIngresarListaEspera{repositorio: repo, publicador: pub, auditoria: aud}
}

func (c *CasoUsoIngresarListaEspera) Ejecutar(
	ctx context.Context,
	solicitud SolicitudIngresarListaEspera,
) (RespuestaIngresarListaEspera, error) {
	if solicitud.ClienteID == "" || solicitud.SucursalID == "" || solicitud.ServicioID == "" || solicitud.FechaHoraDeseada == "" {
		return RespuestaIngresarListaEspera{}, errores.ErrHorarioInvalido
	}

	entrada := lista_espera.EntradaListaEspera{
		EmpresaID:        solicitud.EmpresaID,
		ClienteID:        solicitud.ClienteID,
		SucursalID:       solicitud.SucursalID,
		ServicioID:       solicitud.ServicioID,
		BarberoID:        solicitud.BarberoID,
		FechaHoraDeseada: solicitud.FechaHoraDeseada,
	}

	id, err := c.repositorio.Ingresar(ctx, entrada)
	if err != nil {
		return RespuestaIngresarListaEspera{}, err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "lista_espera",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle: map[string]any{
			"cliente_id":  solicitud.ClienteID,
			"servicio_id": solicitud.ServicioID,
		},
	})

	c.publicador.Publicar(ctx, eventos.ClienteIngresadoListaEspera(id, solicitud.ClienteID, solicitud.EmpresaID))

	return RespuestaIngresarListaEspera{ListaEsperaID: id}, nil
}
