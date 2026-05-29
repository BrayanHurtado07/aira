package excepciones

// ExcepcionDisponibilidad bloquea un día completo para un barbero en una sede.
// Se usa para vacaciones, feriados, cierres u otros imprevistos.
type ExcepcionDisponibilidad struct {
	ID          string
	BarberoID   string
	SucursalID  string
	Fecha       string // "YYYY-MM-DD"
	Motivo      string // FERIADO | VACACION | CIERRE | OTRO
	Descripcion string
	CreadoEn    string
}

// MotivosValidos define los valores permitidos para el campo Motivo.
var MotivosValidos = map[string]bool{
	"FERIADO":  true,
	"VACACION": true,
	"CIERRE":   true,
	"OTRO":     true,
}
