package lista_espera

// EntradaListaEspera representa a un cliente esperando disponibilidad.
type EntradaListaEspera struct {
	ID               string `json:"id"`
	EmpresaID        string `json:"empresa_id"`
	ClienteID        string `json:"cliente_id"`
	SucursalID       string `json:"sucursal_id"`
	ServicioID       string `json:"servicio_id"`
	BarberoID        string `json:"barbero_id"` // opcional: "" = cualquier barbero
	FechaHoraDeseada string `json:"fecha_hora_deseada"`
	Estado           string `json:"estado"` // ESPERANDO | NOTIFICADO | EXPIRADO | ATENDIDO
}
