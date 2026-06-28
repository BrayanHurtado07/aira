package clientes

import (
	"errors"
	"testing"

	dominioErr "aira/compartido/errores"
)

func TestCliente_ValidarEstaActivo(t *testing.T) {
	casos := []struct {
		estado   EstadoCliente
		operable bool
	}{
		{EstadoClienteActivo, true},
		{EstadoClienteInactivo, false},
		{EstadoClienteBloqueado, false},
	}
	for _, c := range casos {
		err := Cliente{Estado: c.estado}.ValidarEstaActivo()
		if c.operable && err != nil {
			t.Errorf("estado %s: esperaba operable; got %v", c.estado, err)
		}
		if !c.operable && !errors.Is(err, dominioErr.ErrClienteNoOperativo) {
			t.Errorf("estado %s: esperaba ErrClienteNoOperativo; got %v", c.estado, err)
		}
	}
}
