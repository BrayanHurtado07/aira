package planes

type EstadoPlan string

const (
	EstadoPlanActivo   EstadoPlan = "ACTIVO"
	EstadoPlanInactivo EstadoPlan = "INACTIVO"
)

type Plan struct {
	ID     string
	Nombre string
	Estado EstadoPlan
}
