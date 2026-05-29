package http

import (
	"net/http"
	"strings"

	"aira/capacidades/identidad/sesiones"
	"aira/compartido/errores"
	"aira/plataforma/identidad"
)

type MiddlewareAutenticacion struct {
	sesiones sesiones.RepositorioSesion
}

func NuevoMiddlewareAutenticacion(ses sesiones.RepositorioSesion) *MiddlewareAutenticacion {
	return &MiddlewareAutenticacion{sesiones: ses}
}

func (m *MiddlewareAutenticacion) ValidarSesion(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenRaw := extraerToken(r)
		if tokenRaw == "" {
			ResponderError(w, http.StatusUnauthorized, errores.ErrTokenInvalido.Error())
			return
		}

		reclamos, err := identidad.ValidarToken(tokenRaw)
		if err != nil {
			ResponderError(w, http.StatusUnauthorized, errores.ErrTokenInvalido.Error())
			return
		}

		hash := identidad.HashToken(tokenRaw)
		sesion, err := m.sesiones.ObtenerPorTokenHash(r.Context(), hash)
		if err != nil || sesion.Estado != "ACTIVA" {
			ResponderError(w, http.StatusUnauthorized, errores.ErrSesionNoActiva.Error())
			return
		}

		ctx := identidad.ConContexto(r.Context(), identidad.ContextoSesion{
			SesionID:   reclamos.SesionID,
			UsuarioID:  reclamos.UsuarioID,
			EmpresaID:  reclamos.EmpresaID,
			SucursalID: reclamos.SucursalID,
		})

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func extraerToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}
