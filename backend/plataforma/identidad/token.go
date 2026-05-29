package identidad

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type ReclamosToken struct {
	SesionID  string `json:"sesion_id"`
	UsuarioID string `json:"usuario_id"`
	EmpresaID string `json:"empresa_id"`
	SucursalID string `json:"sucursal_id,omitempty"`
	jwt.RegisteredClaims
}

func EmitirToken(sesionID, usuarioID, empresaID, sucursalID string) (string, error) {
	clave := []byte(secretoJWT())

	reclamos := ReclamosToken{
		SesionID:   sesionID,
		UsuarioID:  usuarioID,
		EmpresaID:  empresaID,
		SucursalID: sucursalID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, reclamos)
	return token.SignedString(clave)
}

func ValidarToken(tokenRaw string) (*ReclamosToken, error) {
	clave := []byte(secretoJWT())

	token, err := jwt.ParseWithClaims(tokenRaw, &ReclamosToken{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("algoritmo inesperado: %v", t.Header["alg"])
		}
		return clave, nil
	})
	if err != nil {
		return nil, err
	}

	reclamos, ok := token.Claims.(*ReclamosToken)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("token invalido")
	}

	return reclamos, nil
}

func HashToken(tokenRaw string) string {
	sum := sha256.Sum256([]byte(tokenRaw))
	return hex.EncodeToString(sum[:])
}

func secretoJWT() string {
	if s := os.Getenv("JWT_SECRETO"); s != "" {
		return s
	}
	return "aira-secreto-dev-cambiar-en-produccion"
}
