package contratos

import "context"

type SedeActiva struct {
	ID        string
	EmpresaID string
	Nombre    string
}

// ConsultorSede es el contrato que Organización expone hacia capacidades
// que necesitan consultar el estado de una sede o barbería.
type ConsultorSede interface {
	ObtenerActiva(ctx context.Context, sedeID string) (SedeActiva, error)
	ListarSedesActivas(ctx context.Context, barberiaID string) ([]SedeActiva, error)
}

// ValidadorContextoCoherente verifica que barberiaID + sedeID + periodoID
// son coherentes entre sí (sede pertenece a barbería, período está abierto).
type ValidadorContextoCoherente interface {
	ValidarContexto(ctx context.Context, barberiaID, sedeID, periodoID string) error
}
