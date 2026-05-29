package plantillas

type EstadoPlantilla string

const (
	EstadoPlantillaActiva   EstadoPlantilla = "ACTIVO"
	EstadoPlantillaInactiva EstadoPlantilla = "INACTIVO"
)

type PlantillaMensaje struct {
	ID                string
	EmpresaID         string
	Nombre            string
	Canal             string
	ContenidoPlantilla string
	Estado            EstadoPlantilla
}
