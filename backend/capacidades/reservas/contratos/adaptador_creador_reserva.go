package contratos

import (
	"context"

	casoReservas "aira/capacidades/reservas/casos_uso"
)

type adaptadorCreadorReserva struct {
	registrar *casoReservas.CasoUsoRegistrarReserva
	cancelar  *casoReservas.CasoUsoCancelarReserva
}

func NuevoCreadorReserva(
	registrar *casoReservas.CasoUsoRegistrarReserva,
	cancelar *casoReservas.CasoUsoCancelarReserva,
) CreadorReserva {
	return &adaptadorCreadorReserva{registrar: registrar, cancelar: cancelar}
}

func (a *adaptadorCreadorReserva) RegistrarDesdeChat(
	ctx context.Context,
	solicitud SolicitudReservaTelefonica,
) (ResumenReserva, error) {
	resp, err := a.registrar.Ejecutar(ctx, casoReservas.SolicitudRegistrarReserva{
		EmpresaID:       solicitud.EmpresaID,
		SucursalID:      solicitud.SucursalID,
		ClienteID:       solicitud.ClienteID,
		BarberoID:       solicitud.BarberoID,
		ServicioID:      solicitud.ServicioID,
		FechaHoraInicio: solicitud.FechaHoraInicio,
		Origen:          "WHATSAPP",
		CreadoPor:       solicitud.CreadoPor,
	})
	if err != nil {
		return ResumenReserva{}, err
	}
	return ResumenReserva{ReservaID: resp.ReservaID, Estado: resp.Estado}, nil
}

func (a *adaptadorCreadorReserva) CancelarDesdeChat(
	ctx context.Context,
	empresaID, reservaID, canceladoPor string,
) error {
	return a.cancelar.Ejecutar(ctx, reservaID, canceladoPor, empresaID)
}
