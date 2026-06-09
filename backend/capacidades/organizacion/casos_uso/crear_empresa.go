package casos_uso

import (
	"context"
	"regexp"
	"strings"
	"unicode"

	"aira/capacidades/organizacion/barberias"
	"aira/compartido/eventos"
	"aira/plataforma/gobierno/auditoria"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

type SolicitudCrearEmpresa struct {
	Nombre          string `json:"nombre"`
	RUC             string `json:"ruc"`
	Email           string `json:"email"`
	Telefono        string `json:"telefono"`
	DireccionFiscal string `json:"direccion_fiscal"`
	ZonaHoraria     string `json:"zona_horaria"`
	Moneda          string `json:"moneda"`
	CreadoPor       string `json:"-"`
}

type RespuestaCrearEmpresa struct {
	EmpresaID string
	Slug      string
}

type CasoUsoCrearEmpresa struct {
	repositorio barberias.RepositorioEmpresa
	publicador  eventos.PublicadorEventos
	auditoria   auditoria.Auditoria
}

func NuevoCasoUsoCrearEmpresa(
	repo barberias.RepositorioEmpresa,
	pub eventos.PublicadorEventos,
	aud auditoria.Auditoria,
) *CasoUsoCrearEmpresa {
	return &CasoUsoCrearEmpresa{repositorio: repo, publicador: pub, auditoria: aud}
}

func (c *CasoUsoCrearEmpresa) Ejecutar(
	ctx context.Context,
	solicitud SolicitudCrearEmpresa,
) (RespuestaCrearEmpresa, error) {
	empresa := barberias.Empresa{
		Nombre: solicitud.Nombre,
		Estado: barberias.EstadoEmpresaActivo,
	}

	id, err := c.repositorio.Guardar(ctx, empresa)
	if err != nil {
		return RespuestaCrearEmpresa{}, err
	}

	slug, _ := c.repositorio.ActualizarSlug(ctx, id, generarSlugDesdeNombre(solicitud.Nombre))

	c.auditoria.Registrar(ctx, auditoria.Evento{
		UsuarioID: solicitud.CreadoPor,
		EmpresaID: id,
		Entidad:   "empresa",
		EntidadID: id,
		Accion:    "CREAR",
		Detalle:   map[string]any{"nombre": solicitud.Nombre, "ruc": solicitud.RUC},
	})

	c.publicador.Publicar(ctx, eventos.BarberiaCreada(id, solicitud.Nombre, solicitud.CreadoPor))

	return RespuestaCrearEmpresa{EmpresaID: id, Slug: slug}, nil
}

var reNoAlfa = regexp.MustCompile(`[^a-z0-9\s-]`)
var reEspacios = regexp.MustCompile(`[\s-]+`)

func generarSlugDesdeNombre(nombre string) string {
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	sin, _, _ := transform.String(t, nombre)
	sin = strings.ToLower(sin)
	sin = reNoAlfa.ReplaceAllString(sin, "")
	sin = reEspacios.ReplaceAllString(sin, "-")
	return strings.Trim(sin, "-")
}
