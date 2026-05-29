package programas

type EstadoPrograma string

const (
	EstadoProgramaActivo   EstadoPrograma = "ACTIVO"
	EstadoProgramaInactivo EstadoPrograma = "INACTIVO"
)

type ProgramaLealtad struct {
	ID                  string
	EmpresaID           string
	Nombre              string
	SellosParaRecompensa int
	DescripcionRecompensa string
	Estado              EstadoPrograma
}
