package lista_espera

// EntradaListaEspera representa a un cliente esperando disponibilidad.
type EntradaListaEspera struct {
	ID               string
	EmpresaID        string
	ClienteID        string
	SucursalID       string
	ServicioID       string
	BarberoID        string  // opcional: "" = cualquier barbero
	FechaHoraDeseada string
	Estado           string  // ESPERANDO | NOTIFICADO | EXPIRADO | ATENDIDO
}
