// Package casos_uso — operaciones de la capacidad Integraciones (Google Calendar).
package casos_uso

import (
	"context"

	"aira/capacidades/integraciones"
	"aira/compartido/errores"
	"aira/plataforma/cifrado"
	"aira/plataforma/gobierno/auditoria"
)

// ── Conectar Google Calendar (guardar token OAuth2 cifrado) ──────────────────

type SolicitudConectarGoogle struct {
	EmpresaID    string `json:"-"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiraEn     string `json:"expira_en"`
	Correo       string `json:"correo_propietario"`
	ConectadoPor string `json:"-"`
}

type CasoUsoConectarGoogleCalendar struct {
	repo      integraciones.RepositorioIntegracion
	claveHex  string
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoConectarGoogleCalendar(repo integraciones.RepositorioIntegracion, claveHex string, aud auditoria.Auditoria) *CasoUsoConectarGoogleCalendar {
	return &CasoUsoConectarGoogleCalendar{repo: repo, claveHex: claveHex, auditoria: aud}
}

func (c *CasoUsoConectarGoogleCalendar) Ejecutar(ctx context.Context, s SolicitudConectarGoogle) error {
	if s.AccessToken == "" || s.RefreshToken == "" || s.ExpiraEn == "" || s.Correo == "" {
		return errores.ErrCampoRequerido
	}

	accessCifrado, err := cifrado.Cifrar(s.AccessToken, c.claveHex)
	if err != nil {
		return errores.ErrOperacionFallida
	}
	refreshCifrado, err := cifrado.Cifrar(s.RefreshToken, c.claveHex)
	if err != nil {
		return errores.ErrOperacionFallida
	}

	if _, err := c.repo.GuardarTokenGoogle(ctx, s.EmpresaID, accessCifrado, refreshCifrado, s.ExpiraEn, s.Correo); err != nil {
		return err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: s.ConectadoPor, EmpresaID: s.EmpresaID,
		Entidad: "token_google_calendar", EntidadID: s.EmpresaID, Accion: "CREAR",
	})
	return nil
}

// ── Desconectar ──────────────────────────────────────────────────────────────

type CasoUsoDesconectarGoogleCalendar struct {
	repo      integraciones.RepositorioIntegracion
	auditoria auditoria.Auditoria
}

func NuevoCasoUsoDesconectarGoogleCalendar(repo integraciones.RepositorioIntegracion, aud auditoria.Auditoria) *CasoUsoDesconectarGoogleCalendar {
	return &CasoUsoDesconectarGoogleCalendar{repo: repo, auditoria: aud}
}

func (c *CasoUsoDesconectarGoogleCalendar) Ejecutar(ctx context.Context, empresaID, desconectadoPor string) error {
	if err := c.repo.RevocarTokenGoogle(ctx, empresaID); err != nil {
		return err
	}
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: desconectadoPor, EmpresaID: empresaID,
		Entidad: "token_google_calendar", EntidadID: empresaID, Accion: "ACTUALIZAR",
		Detalle: map[string]any{"nuevo_estado": "REVOCADO"},
	})
	return nil
}

// ── Sincronizar una reserva con Google Calendar ──────────────────────────────

type CasoUsoSincronizarReserva struct {
	repo          integraciones.RepositorioIntegracion
	sincronizador integraciones.SincronizadorCalendar
	auditoria     auditoria.Auditoria
}

func NuevoCasoUsoSincronizarReserva(repo integraciones.RepositorioIntegracion, sinc integraciones.SincronizadorCalendar, aud auditoria.Auditoria) *CasoUsoSincronizarReserva {
	return &CasoUsoSincronizarReserva{repo: repo, sincronizador: sinc, auditoria: aud}
}

func (c *CasoUsoSincronizarReserva) Ejecutar(ctx context.Context, reservaID, empresaID, creadoPor string) (string, error) {
	// Crear el evento en Google (real o simulado), luego registrar el vínculo.
	// evento_calendar_registrar valida que exista un token ACTIVO de la empresa.
	googleEventID, err := c.sincronizador.CrearEvento(ctx, empresaID, reservaID)
	if err != nil {
		return "", err
	}

	id, err := c.repo.RegistrarEventoCalendar(ctx, reservaID, empresaID, googleEventID, creadoPor)
	if err != nil {
		return "", err
	}

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: creadoPor, EmpresaID: empresaID,
		Entidad: "evento_calendar", EntidadID: id, Accion: "CREAR",
	})
	return id, nil
}
