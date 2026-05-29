package sesion_chat

type SesionChat struct {
	ID             string
	ConversacionID string
	PasoActual     string
	ContextoJSON   []byte
	ExpiraEn       string
}
