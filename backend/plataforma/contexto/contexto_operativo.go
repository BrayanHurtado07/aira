package contexto

import (
	"context"

	"aira/capacidades/organizacion/barberias"
	"aira/capacidades/organizacion/periodos"
	"aira/capacidades/organizacion/sedes"
	"aira/compartido/errores"
)

type ContextoOperativo struct {
	EmpresaID  string
	SucursalID string
	PeriodoID  string
}

type ValidadorContextoCoherente struct {
	empresas   barberias.RepositorioEmpresa
	sucursales sedes.RepositorioSucursal
	periodos   periodos.RepositorioPeriodo
}

func NuevoValidadorContexto(
	emp barberias.RepositorioEmpresa,
	suc sedes.RepositorioSucursal,
	per periodos.RepositorioPeriodo,
) *ValidadorContextoCoherente {
	return &ValidadorContextoCoherente{empresas: emp, sucursales: suc, periodos: per}
}

func (v *ValidadorContextoCoherente) Validar(ctx context.Context, c ContextoOperativo) error {
	empresa, err := v.empresas.ObtenerActiva(ctx, c.EmpresaID)
	if err != nil {
		return errores.ErrEmpresaNoActiva
	}
	if err := empresa.ValidarEstaActiva(); err != nil {
		return err
	}

	if c.SucursalID != "" {
		sucursal, err := v.sucursales.ObtenerActiva(ctx, c.SucursalID)
		if err != nil {
			return errores.ErrSucursalNoActiva
		}
		if !sucursal.PerteneceAEmpresa(c.EmpresaID) {
			return errores.ErrSucursalFueraDeEmpresa
		}
	}

	if c.PeriodoID != "" {
		periodo, err := v.periodos.ObtenerActivo(ctx, c.PeriodoID)
		if err != nil {
			return errores.ErrPeriodoNoAbierto
		}
		if periodo.EmpresaID != c.EmpresaID {
			return errores.ErrPeriodoNoAbierto
		}
		if err := periodo.ValidarEstaAbierto(); err != nil {
			return err
		}
	}

	return nil
}
