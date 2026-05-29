package clientes

import "context"

type RepositorioCliente interface {
	ObtenerActivo(ctx context.Context, id string) (Cliente, error)
	ObtenerPorTelefono(ctx context.Context, empresaID, telefono string) (Cliente, error)
	Guardar(ctx context.Context, cliente Cliente) (string, error)
	ActualizarCliente(ctx context.Context, clienteID, nombre, telefono, correo string) error
	ActualizarEstadoCliente(ctx context.Context, clienteID, estado string) error
}
