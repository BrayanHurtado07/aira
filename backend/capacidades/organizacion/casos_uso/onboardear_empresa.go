package casos_uso

import (
	"context"

	"aira/capacidades/gobierno_acceso/alcances"
	"aira/capacidades/identidad/usuarios"
	"aira/capacidades/organizacion/barberias"
	"aira/compartido/errores"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
	"golang.org/x/crypto/bcrypt"
)

// SolicitudOnboardearEmpresa registra una empresa nueva y su administrador inicial.
// Solo puede ejecutarla un SUPERADMIN.
type SolicitudOnboardearEmpresa struct {
	NombreEmpresa string `json:"nombre_empresa"`
	NombreAdmin   string `json:"nombre_admin"`
	CorreoAdmin   string `json:"correo_admin"`
	PasswordAdmin string `json:"password_admin"`
	// Primera sede (opcionales; con valores por defecto operables)
	NombreSede   string `json:"nombre_sede"`
	Direccion    string `json:"direccion"`
	ZonaHoraria  string `json:"zona_horaria"`
	CreadoPor    string `json:"-"` // ID del superadmin
}

type RespuestaOnboardearEmpresa struct {
	EmpresaID   string `json:"empresa_id"`
	Slug        string `json:"slug"`
	UsuarioID   string `json:"usuario_id"`
	CorreoAdmin string `json:"correo_admin"`
	SedeID      string `json:"sede_id"`
	PeriodoID   string `json:"periodo_id"`
}

type CasoUsoOnboardearEmpresa struct {
	repoEmpresa  barberias.RepositorioEmpresa
	repoUsuario  usuarios.RepositorioUsuario
	repoAlcance  alcances.RepositorioAlcance
	publicador   eventos.PublicadorEventos
	auditoria    auditoria.Auditoria
}

func NuevoCasoUsoOnboardearEmpresa(
	repoEmpresa barberias.RepositorioEmpresa,
	repoUsuario usuarios.RepositorioUsuario,
	repoAlcance alcances.RepositorioAlcance,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoOnboardearEmpresa {
	return &CasoUsoOnboardearEmpresa{
		repoEmpresa: repoEmpresa,
		repoUsuario: repoUsuario,
		repoAlcance: repoAlcance,
		publicador:  pub,
		auditoria:   aud,
	}
}

func (c *CasoUsoOnboardearEmpresa) Ejecutar(
	ctx context.Context,
	sol SolicitudOnboardearEmpresa,
) (RespuestaOnboardearEmpresa, error) {
	// ── 1. Validar correo disponible ─────────────────────────────────────────
	if _, err := c.repoUsuario.ObtenerPorCorreo(ctx, sol.CorreoAdmin); err == nil {
		return RespuestaOnboardearEmpresa{}, errores.ErrCorreoYaRegistrado
	}

	// ── 2. Crear empresa ─────────────────────────────────────────────────────
	empresaID, err := c.repoEmpresa.Guardar(ctx, barberias.Empresa{
		Nombre: sol.NombreEmpresa,
		Estado: barberias.EstadoEmpresaActivo,
	})
	if err != nil {
		return RespuestaOnboardearEmpresa{}, err
	}

	slug, _ := c.repoEmpresa.ActualizarSlug(ctx, empresaID, generarSlugDesdeNombre(sol.NombreEmpresa))

	// ── 2b. Aprovisionar operación inicial: suscripción + primera sede + periodo ──
	nombreSede := sol.NombreSede
	if nombreSede == "" {
		nombreSede = "Sede Principal"
	}
	direccion := sol.Direccion
	if direccion == "" {
		direccion = "-"
	}
	zonaHoraria := sol.ZonaHoraria
	if zonaHoraria == "" {
		zonaHoraria = "America/Lima"
	}
	sedeID, periodoID, err := c.repoEmpresa.AprovisionarOperacionInicial(
		ctx, empresaID, nombreSede, direccion, zonaHoraria, sol.CreadoPor)
	if err != nil {
		return RespuestaOnboardearEmpresa{}, err
	}

	// ── 3. Crear usuario administrador ───────────────────────────────────────
	hash, err := bcrypt.GenerateFromPassword([]byte(sol.PasswordAdmin), bcrypt.DefaultCost)
	if err != nil {
		return RespuestaOnboardearEmpresa{}, errores.ErrOperacionFallida
	}

	usuarioID, err := c.repoUsuario.Guardar(ctx, usuarios.Usuario{
		Nombre: sol.NombreAdmin,
		Correo: sol.CorreoAdmin,
		Estado: usuarios.EstadoUsuarioActivo,
	}, string(hash))
	if err != nil {
		return RespuestaOnboardearEmpresa{}, err
	}

	// ── 4. Asignar rol ADMIN_BARBERIA al nuevo usuario en la empresa ─────────
	rolID, err := c.repoAlcance.BuscarIDRolPorNombre(ctx, "ADMIN")
	if err != nil || rolID == "" {
		return RespuestaOnboardearEmpresa{}, errores.ErrOperacionFallida
	}

	if _, err := c.repoAlcance.Asignar(ctx, alcances.Alcance{
		UsuarioID: usuarioID,
		EmpresaID: empresaID,
		RolID:     rolID,
		Estado:    alcances.EstadoAlcanceActivo,
	}); err != nil {
		return RespuestaOnboardearEmpresa{}, err
	}

	// ── 5. Auditoría ─────────────────────────────────────────────────────────
	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: sol.CreadoPor,
		EmpresaID: empresaID,
		Entidad:   "empresa",
		EntidadID: empresaID,
		Accion:    "ONBOARDEAR",
		Detalle: map[string]any{
			"nombre_empresa": sol.NombreEmpresa,
			"correo_admin":   sol.CorreoAdmin,
		},
	})

	c.publicador.Publicar(ctx, eventos.BarberiaCreada(empresaID, sol.NombreEmpresa, sol.CreadoPor))

	return RespuestaOnboardearEmpresa{
		EmpresaID:   empresaID,
		Slug:        slug,
		UsuarioID:   usuarioID,
		CorreoAdmin: sol.CorreoAdmin,
		SedeID:      sedeID,
		PeriodoID:   periodoID,
	}, nil
}
