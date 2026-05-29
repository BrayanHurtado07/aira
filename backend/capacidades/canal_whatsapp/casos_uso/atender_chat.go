package casos_uso

import (
	"context"

	contratosAgenda "aira/capacidades/agenda/contratos"
	contratosOrg "aira/capacidades/organizacion/contratos"
	contratosReservas "aira/capacidades/reservas/contratos"
)

type SolicitudReservaDesdeChat struct {
	EmpresaID       string
	SucursalID      string
	ClienteID       string
	BarberoID       string
	ServicioID      string
	FechaHoraInicio string
	CreadoPor       string
}

type RespuestaDisponibilidadChat struct {
	Bloques []contratosAgenda.BloqueLibre
}

type RespuestaSedesChat struct {
	Sedes []contratosOrg.SedeActiva
}

type CasoUsoAtenderChat struct {
	creadorReserva        contratosReservas.CreadorReserva
	consultorDisponibilidad contratosAgenda.ConsultorDisponibilidad
	consultorSede         contratosOrg.ConsultorSede
}

func NuevoCasoUsoAtenderChat(
	creador contratosReservas.CreadorReserva,
	consultor contratosAgenda.ConsultorDisponibilidad,
	sede contratosOrg.ConsultorSede,
) *CasoUsoAtenderChat {
	return &CasoUsoAtenderChat{
		creadorReserva:        creador,
		consultorDisponibilidad: consultor,
		consultorSede:         sede,
	}
}

func (c *CasoUsoAtenderChat) ConsultarDisponibilidad(
	ctx context.Context,
	sucursalID, fecha string,
) (RespuestaDisponibilidadChat, error) {
	bloques, err := c.consultorDisponibilidad.ListarLibres(ctx, sucursalID, fecha)
	if err != nil {
		return RespuestaDisponibilidadChat{}, err
	}
	return RespuestaDisponibilidadChat{Bloques: bloques}, nil
}

func (c *CasoUsoAtenderChat) ListarSedes(
	ctx context.Context,
	barberiaID string,
) (RespuestaSedesChat, error) {
	sedes, err := c.consultorSede.ListarSedesActivas(ctx, barberiaID)
	if err != nil {
		return RespuestaSedesChat{}, err
	}
	return RespuestaSedesChat{Sedes: sedes}, nil
}

func (c *CasoUsoAtenderChat) RegistrarReservaDesdeChat(
	ctx context.Context,
	solicitud SolicitudReservaDesdeChat,
) (contratosReservas.ResumenReserva, error) {
	return c.creadorReserva.RegistrarDesdeChat(ctx, contratosReservas.SolicitudReservaTelefonica{
		EmpresaID:       solicitud.EmpresaID,
		SucursalID:      solicitud.SucursalID,
		ClienteID:       solicitud.ClienteID,
		BarberoID:       solicitud.BarberoID,
		ServicioID:      solicitud.ServicioID,
		FechaHoraInicio: solicitud.FechaHoraInicio,
		CreadoPor:       solicitud.CreadoPor,
	})
}

func (c *CasoUsoAtenderChat) CancelarReservaDesdeChat(
	ctx context.Context,
	empresaID, reservaID, canceladoPor string,
) error {
	return c.creadorReserva.CancelarDesdeChat(ctx, empresaID, reservaID, canceladoPor)
}
