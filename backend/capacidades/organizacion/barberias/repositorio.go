package barberias

import "context"

// EmpresaResumen es la vista plana que usa el panel SUPERADMIN.
type EmpresaResumen struct {
	ID                  string
	Nombre              string
	Slug                string
	Estado              string
	CreadoEn            string
	BarberosActivos     int
	SucursalesActivas   int
	ReservasUltimoMes   int
	EstadoSuscripcion   string
}

type RepositorioEmpresa interface {
	ObtenerActiva(ctx context.Context, id string) (Empresa, error)
	Guardar(ctx context.Context, empresa Empresa) (string, error)
	ActualizarSlug(ctx context.Context, empresaID, slug string) (string, error)
	// AprovisionarOperacionInicial deja a una empresa recién creada operable:
	// suscripción ACTIVA + primera sede + primer periodo (atómico). Devuelve sede y periodo.
	AprovisionarOperacionInicial(ctx context.Context, empresaID, nombreSede, direccion, zonaHoraria, creadoPor string) (sedeID, periodoID string, err error)
	ResolverSlug(ctx context.Context, slug string) (string, error)
	ObtenerConfiguracion(ctx context.Context, empresaID string) (ConfiguracionEmpresa, error)
	GuardarConfiguracion(ctx context.Context, config ConfiguracionEmpresa, actualizadoPor string) error
	// ListarTodasConMetricas devuelve todas las empresas con métricas de actividad. Solo SUPERADMIN.
	ListarTodasConMetricas(ctx context.Context) ([]EmpresaResumen, error)
}
