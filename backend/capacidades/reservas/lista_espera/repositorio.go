package lista_espera

import "context"

type RepositorioListaEspera interface {
	Ingresar(ctx context.Context, entrada EntradaListaEspera) (string, error)
	ListarPorEmpresa(ctx context.Context, empresaID string) ([]EntradaListaEspera, error)
}
