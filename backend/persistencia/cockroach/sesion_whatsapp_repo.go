package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/canal_whatsapp/sesion_wa"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RepositorioSesionWhatsAppCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioSesionWhatsApp(pool *pgxpool.Pool) *RepositorioSesionWhatsAppCockroach {
	return &RepositorioSesionWhatsAppCockroach{pool: pool}
}

// ObtenerConectada devuelve la sesión WhatsApp activa de la empresa.
// Retorna error si no existe o no está CONECTADA.
func (r *RepositorioSesionWhatsAppCockroach) ObtenerConectada(
	ctx context.Context,
	empresaID string,
) (sesion_wa.SesionWhatsApp, error) {
	var s sesion_wa.SesionWhatsApp
	var phoneID *string

	err := r.pool.QueryRow(ctx,
		`SELECT id_sesion_wa, id_empresa, numero_telefono,
		        id_numero_telefono_meta, token_acceso_cifrado,
		        proveedor, estado
		 FROM sesion_whatsapp_empresa
		 WHERE id_empresa = $1 AND estado = 'CONECTADO'
		 LIMIT 1`,
		empresaID,
	).Scan(
		&s.ID, &s.EmpresaID, &s.NumeroTelefono,
		&phoneID, &s.TokenAccesoCifrado,
		&s.Proveedor, &s.Estado,
	)
	if err != nil {
		return sesion_wa.SesionWhatsApp{}, fmt.Errorf("sesion whatsapp no encontrada para empresa %s", empresaID)
	}
	if phoneID != nil {
		s.IDNumeroTelefonoMeta = *phoneID
	}
	return s, nil
}

var _ sesion_wa.RepositorioSesionWhatsApp = (*RepositorioSesionWhatsAppCockroach)(nil)
