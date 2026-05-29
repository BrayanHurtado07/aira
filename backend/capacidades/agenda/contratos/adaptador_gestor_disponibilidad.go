package contratos

import (
	"context"

	"aira/capacidades/agenda/disponibilidad"
)

type adaptadorGestorDisponibilidad struct {
	repo disponibilidad.RepositorioDisponibilidad
}

func NuevoGestorDisponibilidad(repo disponibilidad.RepositorioDisponibilidad) GestorDisponibilidad {
	return &adaptadorGestorDisponibilidad{repo: repo}
}

func NuevoConsultorDisponibilidad(repo disponibilidad.RepositorioDisponibilidad) ConsultorDisponibilidad {
	return &adaptadorGestorDisponibilidad{repo: repo}
}

func (a *adaptadorGestorDisponibilidad) ObtenerLibre(ctx context.Context, disponibilidadID string) (BloqueLibre, error) {
	bloque, err := a.repo.ObtenerPorID(ctx, disponibilidadID)
	if err != nil {
		return BloqueLibre{}, err
	}
	return BloqueLibre{
		ID:         bloque.ID,
		BarberoID:  bloque.BarberoID,
		SucursalID: bloque.SucursalID,
		DiaSemana:  bloque.DiaSemana,
		HoraInicio: bloque.HoraInicio,
		HoraFin:    bloque.HoraFin,
	}, nil
}

func (a *adaptadorGestorDisponibilidad) MarcarReservada(ctx context.Context, disponibilidadID string) error {
	return a.repo.MarcarReservada(ctx, disponibilidadID)
}

func (a *adaptadorGestorDisponibilidad) LiberarBloque(ctx context.Context, disponibilidadID string) error {
	return a.repo.LiberarBloque(ctx, disponibilidadID)
}

func (a *adaptadorGestorDisponibilidad) ListarLibres(ctx context.Context, sucursalID, fecha string) ([]BloqueLibre, error) {
	bloques, err := a.repo.ListarLibres(ctx, sucursalID, fecha)
	if err != nil {
		return nil, err
	}
	resultado := make([]BloqueLibre, len(bloques))
	for i, b := range bloques {
		resultado[i] = BloqueLibre{
			ID:         b.ID,
			BarberoID:  b.BarberoID,
			SucursalID: b.SucursalID,
			DiaSemana:  b.DiaSemana,
			HoraInicio: b.HoraInicio,
			HoraFin:    b.HoraFin,
		}
	}
	return resultado, nil
}
