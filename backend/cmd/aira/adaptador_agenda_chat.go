package main

import (
	"context"

	casoCanal "aira/capacidades/canal_whatsapp/casos_uso"
	casoReservas "aira/capacidades/reservas/casos_uso"
	"aira/persistencia/cockroach"
)

// adaptadorAgendaChat conecta el flujo de agendamiento conversacional (Aira IA)
// con los repositorios y casos de uso reales. Vive en la composición para que el
// caso de uso no dependa de la infraestructura.
type adaptadorAgendaChat struct {
	repoSucursal     *cockroach.RepositorioSucursalCockroach
	repoServicio     *cockroach.RepositorioServicioCockroach
	repoBarbero      *cockroach.RepositorioBarberosCockroach
	registrarCliente *casoReservas.CasoUsoRegistrarCliente
	atenderChat      *casoCanal.CasoUsoAtenderChat
}

func (a *adaptadorAgendaChat) ListarSedes(ctx context.Context, empresaID string) ([]casoCanal.OpcionChat, error) {
	sedes, err := a.repoSucursal.ListarActivas(ctx, empresaID)
	if err != nil {
		return nil, err
	}
	ops := make([]casoCanal.OpcionChat, 0, len(sedes))
	for _, s := range sedes {
		ops = append(ops, casoCanal.OpcionChat{ID: s.ID, Nombre: s.Nombre})
	}
	return ops, nil
}

func (a *adaptadorAgendaChat) ListarServicios(ctx context.Context, empresaID string) ([]casoCanal.OpcionChat, error) {
	servicios, err := a.repoServicio.ListarActivos(ctx, empresaID)
	if err != nil {
		return nil, err
	}
	ops := make([]casoCanal.OpcionChat, 0, len(servicios))
	for _, s := range servicios {
		ops = append(ops, casoCanal.OpcionChat{ID: s.ID, Nombre: s.Nombre})
	}
	return ops, nil
}

func (a *adaptadorAgendaChat) BarberosDisponibles(ctx context.Context, empresaID, sucursalID, servicioID, fechaHoraInicio string) ([]casoCanal.OpcionChat, error) {
	barberos, err := a.repoBarbero.BarberosDisponiblesPorSede(ctx, empresaID, sucursalID, servicioID, fechaHoraInicio)
	if err != nil {
		return nil, err
	}
	ops := make([]casoCanal.OpcionChat, 0, len(barberos))
	for _, b := range barberos {
		ops = append(ops, casoCanal.OpcionChat{ID: b.ID, Nombre: b.Nombre})
	}
	return ops, nil
}

func (a *adaptadorAgendaChat) RegistrarClientePorTelefono(ctx context.Context, empresaID, telefono string) (string, error) {
	resp, err := a.registrarCliente.Ejecutar(ctx, casoReservas.SolicitudRegistrarCliente{
		EmpresaID: empresaID,
		Nombre:    "Cliente " + telefono,
		Telefono:  telefono,
	})
	if err != nil {
		return "", err
	}
	return resp.ClienteID, nil
}

func (a *adaptadorAgendaChat) CrearReserva(ctx context.Context, empresaID, sucursalID, clienteID, barberoID, servicioID, fechaHoraInicio string) error {
	_, err := a.atenderChat.RegistrarReservaDesdeChat(ctx, casoCanal.SolicitudReservaDesdeChat{
		EmpresaID:       empresaID,
		SucursalID:      sucursalID,
		ClienteID:       clienteID,
		BarberoID:       barberoID,
		ServicioID:      servicioID,
		FechaHoraInicio: fechaHoraInicio,
	})
	return err
}
