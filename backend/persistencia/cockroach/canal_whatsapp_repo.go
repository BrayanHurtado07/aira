package cockroach

import (
	"context"
	"encoding/json"
	"fmt"

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

func (r *RepositorioSesionChatCockroach) ObtenerPorConversacion(ctx context.Context, conversacionID string) (sesion_chat.SesionChat, error) {
	var sc sesion_chat.SesionChat
	err := r.pool.QueryRow(ctx,
		`SELECT id_sesion_chat, id_conversacion, paso_actual, expira_en
		 FROM sesion_chat WHERE id_conversacion = $1`,
		conversacionID,
	).Scan(&sc.ID, &sc.ConversacionID, &sc.PasoActual, &sc.ExpiraEn)
	if err != nil {
		return sesion_chat.SesionChat{}, errores.ErrConversacionNoExiste
	}
	return sc, nil
}
