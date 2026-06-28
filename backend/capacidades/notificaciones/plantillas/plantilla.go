package plantillas

type EstadoPlantilla string

const (
	EstadoPlantillaActiva   EstadoPlantilla = "ACTIVO"
	EstadoPlantillaInactiva EstadoPlantilla = "INACTIVO"
)

type PlantillaMensaje struct {
	ID                 string          `json:"id"`
	EmpresaID          string          `json:"empresa_id"`
	Nombre             string          `json:"nombre"`
	Canal              string          `json:"canal"`
	ContenidoPlantilla string          `json:"contenido_plantilla"`
	Estado             EstadoPlantilla `json:"estado"`
}
