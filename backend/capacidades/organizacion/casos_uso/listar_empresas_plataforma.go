package casos_uso

import (
	"context"

	"aira/capacidades/organizacion/barberias"
)

type RespuestaListarEmpresasPlataforma struct {
	Empresas []barberias.EmpresaResumen `json:"empresas"`
	Total    int                        `json:"total"`
}

type CasoUsoListarEmpresasPlataforma struct {
	repoEmpresa barberias.RepositorioEmpresa
}

func NuevoCasoUsoListarEmpresasPlataforma(
	repo barberias.RepositorioEmpresa,
) *CasoUsoListarEmpresasPlataforma {
	return &CasoUsoListarEmpresasPlataforma{repoEmpresa: repo}
}

func (c *CasoUsoListarEmpresasPlataforma) Ejecutar(
	ctx context.Context,
) (RespuestaListarEmpresasPlataforma, error) {
	lista, err := c.repoEmpresa.ListarTodasConMetricas(ctx)
	if err != nil {
		return RespuestaListarEmpresasPlataforma{}, err
	}
	return RespuestaListarEmpresasPlataforma{
		Empresas: lista,
		Total:    len(lista),
	}, nil
}
