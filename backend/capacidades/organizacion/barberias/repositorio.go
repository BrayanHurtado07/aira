package barberias

import "context"

type RepositorioEmpresa interface {
	ObtenerActiva(ctx context.Context, id string) (Empresa, error)
	Guardar(ctx context.Context, empresa Empresa) (string, error)
	ObtenerConfiguracion(ctx context.Context, empresaID string) (ConfiguracionEmpresa, error)
	GuardarConfiguracion(ctx context.Context, config ConfiguracionEmpresa, actualizadoPor string) error
}
