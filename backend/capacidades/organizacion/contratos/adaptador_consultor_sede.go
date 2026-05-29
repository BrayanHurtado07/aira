package contratos

import (
	"context"

	"aira/capacidades/organizacion/periodos"
	"aira/capacidades/organizacion/sedes"
	"aira/compartido/errores"
)

// adaptadorConsultorSede implementa ConsultorSede y ValidadorContextoCoherente.
type adaptadorConsultorSede struct {
	repoSucursal sedes.RepositorioSucursal
	repoPeriodo  periodos.RepositorioPeriodo
}

func NuevoConsultorSede(
	repoSucursal sedes.RepositorioSucursal,
	repoPeriodo periodos.RepositorioPeriodo,
) ConsultorSede {
	return &adaptadorConsultorSede{repoSucursal: repoSucursal, repoPeriodo: repoPeriodo}
}

func NuevoValidadorContextoCoherente(
	repoSucursal sedes.RepositorioSucursal,
	repoPeriodo periodos.RepositorioPeriodo,
) ValidadorContextoCoherente {
	return &adaptadorConsultorSede{repoSucursal: repoSucursal, repoPeriodo: repoPeriodo}
}

func (a *adaptadorConsultorSede) ObtenerActiva(ctx context.Context, sedeID string) (SedeActiva, error) {
	sede, err := a.repoSucursal.ObtenerActiva(ctx, sedeID)
	if err != nil {
		return SedeActiva{}, err
	}
	return SedeActiva{ID: sede.ID, EmpresaID: sede.EmpresaID, Nombre: sede.Nombre}, nil
}

func (a *adaptadorConsultorSede) ListarSedesActivas(ctx context.Context, barberiaID string) ([]SedeActiva, error) {
	lista, err := a.repoSucursal.ListarActivas(ctx, barberiaID)
	if err != nil {
		return nil, err
	}
	resultado := make([]SedeActiva, len(lista))
	for i, s := range lista {
		resultado[i] = SedeActiva{ID: s.ID, EmpresaID: s.EmpresaID, Nombre: s.Nombre}
	}
	return resultado, nil
}

func (a *adaptadorConsultorSede) ValidarContexto(ctx context.Context, barberiaID, sedeID, periodoID string) error {
	sede, err := a.repoSucursal.ObtenerActiva(ctx, sedeID)
	if err != nil {
		return errores.ErrSucursalNoActiva
	}
	if !sede.PerteneceAEmpresa(barberiaID) {
		return errores.ErrSucursalFueraDeEmpresa
	}
	if periodoID == "" {
		return nil
	}
	periodo, err := a.repoPeriodo.ObtenerActivo(ctx, periodoID)
	if err != nil {
		return errores.ErrPeriodoNoAbierto
	}
	if periodo.EmpresaID != barberiaID {
		return errores.ErrPeriodoNoAbierto
	}
	return periodo.ValidarEstaAbierto()
}
