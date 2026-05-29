package casos_uso

import (
	"context"

	"aira/capacidades/identidad/sesiones"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
	"aira/plataforma/identidad"
	"github.com/google/uuid"
)

type SolicitudRefrescarSesion struct {
	RefreshToken string `json:"refresh_token"`
	EmpresaID    string `json:"empresa_id,omitempty"`
	SucursalID   string `json:"sucursal_id,omitempty"`
}

type RespuestaRefrescarSesion struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	SesionID     string `json:"sesion_id"`
	UsuarioID    string `json:"usuario_id"`
	ExpiraEn     string `json:"expira_en"`
}

type CasoUsoRefrescarSesion struct {
	sesiones   sesiones.RepositorioSesion
	publicador eventos.PublicadorEventos
	auditoria  auditoria.Auditoria
}

func NuevoCasoUsoRefrescarSesion(
	ses sesiones.RepositorioSesion,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoRefrescarSesion {
	return &CasoUsoRefrescarSesion{sesiones: ses, publicador: pub, auditoria: aud}
}

func (c *CasoUsoRefrescarSesion) Ejecutar(
	ctx context.Context,
	solicitud SolicitudRefrescarSesion,
) (RespuestaRefrescarSesion, error) {
	if solicitud.RefreshToken == "" {
		return RespuestaRefrescarSesion{}, errores.ErrTokenInvalido
	}

	refreshHash := identidad.HashToken(solicitud.RefreshToken)
	sesion, err := c.sesiones.ObtenerPorRefreshHash(ctx, refreshHash)
	if err != nil {
		return RespuestaRefrescarSesion{}, errores.ErrTokenInvalido
	}

	// Emitir nuevo JWT
	nuevoToken, err := identidad.EmitirToken(sesion.ID, sesion.UsuarioID, solicitud.EmpresaID, solicitud.SucursalID)
	if err != nil {
		return RespuestaRefrescarSesion{}, errores.ErrOperacionFallida
	}

	nuevoTokenHash := identidad.HashToken(nuevoToken)
	nuevoRefreshRaw := uuid.New().String()
	nuevoRefreshHash := identidad.HashToken(nuevoRefreshRaw)

	if err := c.sesiones.ActualizarHashes(ctx, sesion.ID, nuevoTokenHash, nuevoRefreshHash); err != nil {
		return RespuestaRefrescarSesion{}, errores.ErrOperacionFallida
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: sesion.UsuarioID,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "sesion_global",
		EntidadID: sesion.ID,
		Accion:    "REFRESCAR_SESION",
		Detalle:   map[string]any{"sesion_id": sesion.ID},
	})

	c.publicador.Publicar(ctx, eventos.SesionRefrescada(sesion.ID, sesion.UsuarioID, solicitud.EmpresaID))

	return RespuestaRefrescarSesion{
		Token:        nuevoToken,
		RefreshToken: nuevoRefreshRaw,
		SesionID:     sesion.ID,
		UsuarioID:    sesion.UsuarioID,
	}, nil
}
