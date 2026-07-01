package cockroach

import (
	"context"
	"encoding/json"
	"fmt"

	"aira/capacidades/canal_whatsapp/atajos"
	"aira/capacidades/canal_whatsapp/casos_uso"
	"aira/capacidades/canal_whatsapp/conversaciones"
	"aira/capacidades/canal_whatsapp/sesion_chat"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositorioConversacionCockroach

type RepositorioConversacionCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioConversacion(pool *pgxpool.Pool) *RepositorioConversacionCockroach {
	return &RepositorioConversacionCockroach{pool: pool}
}

func (r *RepositorioConversacionCockroach) Iniciar(ctx context.Context, empresaID, numeroCliente string) (conversaciones.Conversacion, bool, error) {
	resultado, err := LlamarProc(ctx, r.pool, "conversacion_iniciar", empresaID, numeroCliente, nil)
	if err != nil {
		return conversaciones.Conversacion{}, false, err
	}
	if !resultado.Exito {
		return conversaciones.Conversacion{}, false, fmt.Errorf("%s", resultado.Error)
	}

	id := ExtraerCampo(resultado.Datos, "id_conversacion")

	var m map[string]any
	esNueva := true
	if resultado.Datos != nil {
		if err := json.Unmarshal(resultado.Datos, &m); err == nil {
			if v, ok := m["nueva"].(bool); ok {
				esNueva = v
			}
		}
	}

	return conversaciones.Conversacion{
		ID:            id,
		EmpresaID:     empresaID,
		NumeroCliente: numeroCliente,
		Estado:        conversaciones.EstadoConversacionActiva,
	}, esNueva, nil
}

func (r *RepositorioConversacionCockroach) ObtenerActiva(ctx context.Context, id string) (conversaciones.Conversacion, error) {
	var c conversaciones.Conversacion
	err := r.pool.QueryRow(ctx,
		`SELECT id_conversacion, id_empresa, numero_cliente_wa, estado
		 FROM conversacion WHERE id_conversacion = $1 AND estado = 'ACTIVA'`,
		id,
	).Scan(&c.ID, &c.EmpresaID, &c.NumeroCliente, &c.Estado)
	if err != nil {
		return conversaciones.Conversacion{}, errores.ErrConversacionNoExiste
	}
	return c, nil
}

// ConversacionResumen es la vista de lista de la bandeja de WhatsApp (forma JSON
// que consume el frontend).
type ConversacionResumen struct {
	ID            string `json:"id"`
	EmpresaID     string `json:"empresa_id"`
	NumeroCliente string `json:"numero_cliente"`
	Estado        string `json:"estado"`
	CreadoEn      string `json:"creado_en"`
}

// ListarPorEmpresa devuelve las conversaciones de una empresa, más recientes primero.
func (r *RepositorioConversacionCockroach) ListarPorEmpresa(ctx context.Context, empresaID string) ([]ConversacionResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT id_conversacion, id_empresa, numero_cliente_wa, estado, creado_en::STRING
		 FROM conversacion WHERE id_empresa = $1
		 ORDER BY COALESCE(actualizado_en, creado_en) DESC`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer filas.Close()

	lista := []ConversacionResumen{}
	for filas.Next() {
		var c ConversacionResumen
		if err := filas.Scan(&c.ID, &c.EmpresaID, &c.NumeroCliente, &c.Estado, &c.CreadoEn); err != nil {
			return nil, err
		}
		lista = append(lista, c)
	}
	return lista, filas.Err()
}

// EmpresaDeConversacion devuelve la empresa dueña de una conversación. Sirve para
// validar pertenencia de inquilino antes de operar sobre ella.
func (r *RepositorioConversacionCockroach) EmpresaDeConversacion(ctx context.Context, conversacionID string) (string, error) {
	var empresaID string
	err := r.pool.QueryRow(ctx,
		`SELECT id_empresa FROM conversacion WHERE id_conversacion = $1`,
		conversacionID,
	).Scan(&empresaID)
	if err != nil {
		return "", errores.ErrConversacionNoExiste
	}
	return empresaID, nil
}

// RepositorioMensajeCockroach

type RepositorioMensajeCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioMensaje(pool *pgxpool.Pool) *RepositorioMensajeCockroach {
	return &RepositorioMensajeCockroach{pool: pool}
}

func (r *RepositorioMensajeCockroach) Guardar(ctx context.Context, s casos_uso.SolicitudRegistrarMensaje) (string, error) {
	idExterno := any(s.IDExternoWA)
	if s.IDExternoWA == "" {
		idExterno = nil
	}
	estadoEntrega := any(s.EstadoEntrega)
	if s.EstadoEntrega == "" {
		estadoEntrega = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "mensaje_registrar",
		s.ConversacionID, s.Contenido, s.Tipo, s.Direccion, idExterno, estadoEntrega)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_mensaje"), nil
}

// MensajeResumen es la vista de lista del hilo de una conversación (forma JSON
// que consume el frontend).
type MensajeResumen struct {
	ID             string `json:"id"`
	ConversacionID string `json:"conversacion_id"`
	Contenido      string `json:"contenido"`
	Tipo           string `json:"tipo"`
	Direccion      string `json:"direccion"`
	CreadoEn       string `json:"creado_en"`
}

// ListarPorConversacion devuelve los mensajes de una conversación en orden cronológico.
func (r *RepositorioMensajeCockroach) ListarPorConversacion(ctx context.Context, conversacionID string) ([]MensajeResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT id_mensaje, id_conversacion, contenido, tipo, direccion, enviado_en::STRING
		 FROM mensaje WHERE id_conversacion = $1
		 ORDER BY enviado_en ASC`,
		conversacionID,
	)
	if err != nil {
		return nil, err
	}
	defer filas.Close()

	lista := []MensajeResumen{}
	for filas.Next() {
		var m MensajeResumen
		if err := filas.Scan(&m.ID, &m.ConversacionID, &m.Contenido, &m.Tipo, &m.Direccion, &m.CreadoEn); err != nil {
			return nil, err
		}
		lista = append(lista, m)
	}
	return lista, filas.Err()
}

// RepositorioSesionChatCockroach

type RepositorioSesionChatCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioSesionChat(pool *pgxpool.Pool) *RepositorioSesionChatCockroach {
	return &RepositorioSesionChatCockroach{pool: pool}
}

func (r *RepositorioSesionChatCockroach) Iniciar(
	ctx context.Context,
	s sesion_chat.SolicitudIniciarSesionChat,
) (sesion_chat.SesionChat, error) {
	minutos := s.MinutosVida
	if minutos <= 0 {
		minutos = 30
	}

	var ctxJSON any
	if len(s.ContextoJSON) > 0 {
		ctxJSON = string(s.ContextoJSON)
	}

	// Firma: sesion_chat_iniciar(p_id_conversacion, p_paso_inicial, p_contexto_json, p_minutos_vida)
	resultado, err := LlamarProc(ctx, r.pool, "sesion_chat_iniciar",
		s.ConversacionID, s.PasoInicial, ctxJSON, minutos)
	if err != nil {
		return sesion_chat.SesionChat{}, err
	}
	if !resultado.Exito {
		return sesion_chat.SesionChat{}, fmt.Errorf("%s", resultado.Error)
	}

	return sesion_chat.SesionChat{
		ID:             ExtraerCampo(resultado.Datos, "id_sesion_chat"),
		ConversacionID: s.ConversacionID,
		PasoActual:     s.PasoInicial,
		ExpiraEn:       ExtraerCampo(resultado.Datos, "expira_en"),
	}, nil
}

func (r *RepositorioSesionChatCockroach) Actualizar(
	ctx context.Context,
	s sesion_chat.SolicitudActualizarSesionChat,
) error {
	var ctxJSON any
	if len(s.ContextoJSON) > 0 {
		ctxJSON = string(s.ContextoJSON)
	}

	// Firma: sesion_chat_actualizar(p_id_sesion_chat, p_paso_actual, p_contexto_json DEFAULT NULL)
	resultado, err := LlamarProc(ctx, r.pool, "sesion_chat_actualizar",
		s.SesionChatID, s.PasoActual, ctxJSON)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

// EmpresaDeSesionChat devuelve la empresa dueña de una sesión de chat (vía su
// conversación). Sirve para validar pertenencia de inquilino.
func (r *RepositorioSesionChatCockroach) EmpresaDeSesionChat(ctx context.Context, sesionChatID string) (string, error) {
	var empresaID string
	err := r.pool.QueryRow(ctx,
		`SELECT c.id_empresa
		 FROM sesion_chat s JOIN conversacion c ON c.id_conversacion = s.id_conversacion
		 WHERE s.id_sesion_chat = $1`,
		sesionChatID,
	).Scan(&empresaID)
	if err != nil {
		return "", errores.ErrConversacionNoExiste
	}
	return empresaID, nil
}

func (r *RepositorioSesionChatCockroach) ObtenerPorConversacion(ctx context.Context, conversacionID string) (sesion_chat.SesionChat, error) {
	var sc sesion_chat.SesionChat
	var contexto []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id_sesion_chat, id_conversacion, paso_actual, contexto_json, expira_en::STRING
		 FROM sesion_chat WHERE id_conversacion = $1`,
		conversacionID,
	).Scan(&sc.ID, &sc.ConversacionID, &sc.PasoActual, &contexto, &sc.ExpiraEn)
	if err != nil {
		return sesion_chat.SesionChat{}, errores.ErrConversacionNoExiste
	}
	sc.ContextoJSON = contexto
	return sc, nil
}

// RepositorioAtajoCockroach

var _ atajos.RepositorioAtajo = (*RepositorioAtajoCockroach)(nil)

type RepositorioAtajoCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioAtajo(pool *pgxpool.Pool) *RepositorioAtajoCockroach {
	return &RepositorioAtajoCockroach{pool: pool}
}

func (r *RepositorioAtajoCockroach) Crear(ctx context.Context, a atajos.Atajo, creadoPor string) (string, error) {
	cp := any(creadoPor)
	if creadoPor == "" {
		cp = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "atajo_respuesta_crear",
		a.EmpresaID, a.Titulo, a.Contenido, a.Orden, cp)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "ATAJO_INVALIDO":
			return "", errores.ErrAtajoInvalido
		case "EMPRESA_NO_ACTIVA":
			return "", errores.ErrEmpresaNoActiva
		}
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_atajo"), nil
}

func (r *RepositorioAtajoCockroach) ListarPorEmpresa(ctx context.Context, empresaID string) ([]atajos.Atajo, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT id_atajo, id_empresa, titulo, contenido, orden
		 FROM atajo_respuesta
		 WHERE id_empresa = $1 AND activa = true
		 ORDER BY orden, creado_en`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer filas.Close()

	lista := []atajos.Atajo{}
	for filas.Next() {
		var a atajos.Atajo
		if err := filas.Scan(&a.ID, &a.EmpresaID, &a.Titulo, &a.Contenido, &a.Orden); err != nil {
			return nil, err
		}
		lista = append(lista, a)
	}
	return lista, filas.Err()
}

func (r *RepositorioAtajoCockroach) Eliminar(ctx context.Context, atajoID string) error {
	resultado, err := LlamarProc(ctx, r.pool, "atajo_respuesta_eliminar", atajoID)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		if resultado.Error == "ATAJO_NO_EXISTE" {
			return errores.ErrAtajoNoExiste
		}
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

// EmpresaDeAtajo devuelve la empresa dueña de un atajo, para validar pertenencia
// de inquilino antes de eliminarlo.
func (r *RepositorioAtajoCockroach) EmpresaDeAtajo(ctx context.Context, atajoID string) (string, error) {
	var empresaID string
	err := r.pool.QueryRow(ctx,
		`SELECT id_empresa FROM atajo_respuesta WHERE id_atajo = $1`,
		atajoID,
	).Scan(&empresaID)
	if err != nil {
		return "", errores.ErrAtajoNoExiste
	}
	return empresaID, nil
}
