package excepciones

// ExcepcionDisponibilidad bloquea un día completo para un barbero en una sede.
// Se usa para vacaciones, feriados, cierres u otros imprevistos.
type ExcepcionDisponibilidad struct {
	ID          string `json:"id"`
	BarberoID   string `json:"barbero_id"`
	SucursalID  string `json:"sucursal_id"`
	Fecha       string `json:"fecha"` // "YYYY-MM-DD"
	Motivo      string `json:"motivo"` // FERIADO | VACACION | CIERRE | OTRO
	Descripcion string `json:"descripcion"`
	CreadoEn    string `json:"creado_en"`
}

// MotivosValidos define los valores permitidos para el campo Motivo.
var MotivosValidos = map[string]bool{
	"FERIADO":  true,
	"VACACION": true,
	"CIERRE":   true,
	"OTRO":     true,
}
