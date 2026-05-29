package casos_uso

import (
	"context"
	"time"

	"aira/capacidades/identidad/sesiones"
	"aira/capacidades/identidad/usuarios"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
	"aira/plataforma/identidad"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type SolicitudIniciarSesion struct {
	Correo      string `json:"correo_electronico"`
	Password    string `json:"contrasena"`
	EmpresaID   string `json:"empresa_id,omitempty"`
	SucursalID  string `json:"sucursal_id,omitempty"`
	Dispositivo string `json:"dispositivo,omitempty"`
	IPOrigen    string `json:"-"`
}

type RespuestaIniciarSesion struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	SesionID     string `json:"sesion_id"`
	UsuarioID    string `json:"usuario_id"`
	Nombre       string `json:"nombre"`
	NombreRol    string `json:"nombre_rol"`
	EmpresaID    string `json:"barberia_id"`
	SucursalID   string `json:"sede_id"`
	PeriodoID    string `json:"periodo_id"`
	ExpiraEn     string `json:"expira_en"`
}

// ConsultorRol es la interfaz mínima para consultar el rol del usuario.
// La satisface RepositorioAlcanceCockroach sin importar el paquete de gobierno_acceso.
type ConsultorRol interface {
	ObtenerNombreRol(ctx context.Context, usuarioID, empresaID string) (string, error)
}

type CasoUsoIniciarSesionGlobal struct {
	usuarios     usuarios.RepositorioUsuario
	sesiones     sesiones.RepositorioSesion
	consultorRol ConsultorRol
	publicador   eventos.PublicadorEventos
	auditoria    auditoria.Auditoria
}

func NuevoCasoUsoIniciarSesionGlobal(
	us usuarios.RepositorioUsuario,
	ses sesiones.RepositorioSesion,
	consultorRol ConsultorRol,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoIniciarSesionGlobal {
	return &CasoUsoIniciarSesionGlobal{usuarios: us, sesiones: ses, consultorRol: consultorRol, publicador: pub, auditoria: aud}
}

func (c *CasoUsoIniciarSesionGlobal) Ejecutar(
	ctx context.Context,
	solicitud SolicitudIniciarSesion,
) (RespuestaIniciarSesion, error) {
	usuario, err := c.usuarios.ObtenerPorCorreo(ctx, solicitud.Correo)
	if err != nil {
		return RespuestaIniciarSesion{}, errores.ErrCredencialesInvalidas
	}

	if err := usuario.ValidarPuedeAutenticarse(); err != nil {
		c.auditoria.Registrar(ctx, auditoria.Evento{
			UsuarioID: usuario.ID,
			EmpresaID: solicitud.EmpresaID,
			Entidad:   "sesion_global",
			Accion:    "INICIAR_SESION",
			Detalle:   map[string]any{"resultado": "identidad_no_autenticable"},
		})
		return RespuestaIniciarSesion{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.HashPassword), []byte(solicitud.Password)); err != nil {
		c.auditoria.Registrar(ctx, auditoria.Evento{
			UsuarioID: usuario.ID,
			EmpresaID: solicitud.EmpresaID,
			Entidad:   "sesion_global",
			Accion:    "INICIAR_SESION",
			Detalle:   map[string]any{"resultado": "credenciales_invalidas"},
		})
		return RespuestaIniciarSesion{}, errores.ErrCredencialesInvalidas
	}

	if solicitud.EmpresaID == "" {
		if empresaID, err := c.usuarios.ObtenerPrimeraEmpresaActiva(ctx, usuario.ID); err == nil {
			solicitud.EmpresaID = empresaID
		}
	}

	expiraEn := time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339)

	// Crear sesión con hash temporal único para obtener el sesion_id del DB
	tempTokenSeed := identidad.HashToken(usuario.ID + time.Now().String())
	sesionTemp, err := c.sesiones.Guardar(ctx, sesiones.SolicitudGuardarSesion{
		UsuarioID:   usuario.ID,
		TokenHash:   "tmp-" + tempTokenSeed,
		RefreshHash: "tmp-r-" + tempTokenSeed,
		IPOrigen:    solicitud.IPOrigen,
		UserAgent:   solicitud.Dispositivo,
		MinutosVida: 1440,
	})
	if err != nil {
		return RespuestaIniciarSesion{}, err
	}

	// Emitir token definitivo con el sesion_id ya conocido
	token, err := identidad.EmitirToken(sesionTemp.ID, usuario.ID, solicitud.EmpresaID, solicitud.SucursalID)
	if err != nil {
		return RespuestaIniciarSesion{}, errores.ErrOperacionFallida
	}

	tokenHash := identidad.HashToken(token)
	// Refresh token: opaco, aleatorio e independiente del JWT
	refreshTokenRaw := uuid.New().String()
	refreshHash := identidad.HashToken(refreshTokenRaw)

	// Actualizar la sesión con los hashes reales del token definitivo
	if err := c.sesiones.ActualizarHashes(ctx, sesionTemp.ID, tokenHash, refreshHash); err != nil {
		return RespuestaIniciarSesion{}, err
	}
	sesion := sesionTemp

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: usuario.ID,
		EmpresaID: solicitud.EmpresaID,
		Entidad:   "sesion_global",
		EntidadID: sesion.ID,
		Accion:    "INICIAR_SESION",
		Detalle:   map[string]any{"dispositivo": solicitud.Dispositivo},
	})

	c.publicador.Publicar(ctx, eventos.SesionIniciada(sesion.ID, usuario.ID, solicitud.EmpresaID, solicitud.Dispositivo))

	nombreRol, _ := c.consultorRol.ObtenerNombreRol(ctx, usuario.ID, solicitud.EmpresaID)

	return RespuestaIniciarSesion{
		Token:        token,
		RefreshToken: refreshTokenRaw,
		SesionID:     sesion.ID,
		UsuarioID:    usuario.ID,
		Nombre:       usuario.Nombre,
		NombreRol:    nombreRol,
		EmpresaID:    solicitud.EmpresaID,
		SucursalID:   solicitud.SucursalID,
		PeriodoID:    "",
		ExpiraEn:     expiraEn,
	}, nil
}
