package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/lealtad/programas"
	"aira/capacidades/lealtad/sellos"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ── Tipos de consulta ──────────────────────────────────────────────────────────

type SelloResumen struct {
	SelloID   string `json:"sello_id"`
	ClienteID string `json:"cliente_id"`
	ReservaID string `json:"reserva_id"`
	CreadoEn  string `json:"creado_en"`
}

type TarjetaResumen struct {
	TarjetaID     string `json:"tarjeta_id"`
	ClienteID     string `json:"cliente_id"`
	NombreCliente string `json:"nombre_cliente"`
	Telefono      string `json:"telefono"`
	SellosActivos int    `json:"sellos_activos"`
	TotalCanjes   int    `json:"total_canjes"`
}

type ProgramaInfo struct {
	ID                    string `json:"id"`
	Nombre                string `json:"nombre"`
	SellosParaRecompensa  int    `json:"sellos_para_recompensa"`
	DescripcionRecompensa string `json:"descripcion_recompensa"`
	Estado                string `json:"estado"`
}

// ── Repositorio ────────────────────────────────────────────────────────────────

type RepositorioSelloCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioSello(pool *pgxpool.Pool) *RepositorioSelloCockroach {
	return &RepositorioSelloCockroach{pool: pool}
}

func (r *RepositorioSelloCockroach) Acumular(
	ctx context.Context,
	empresaID, clienteID, reservaID, registradoPor string,
) (string, error) {
	regPor := any(registradoPor)
	if registradoPor == "" {
		regPor = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "sello_acumular",
		empresaID, clienteID, reservaID, regPor)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_sello"), nil
}

func (r *RepositorioSelloCockroach) Anular(
	ctx context.Context,
	selloID, motivoAnulacion, anuladoPor string,
) error {
	resultado, err := LlamarProc(ctx, r.pool, "sello_anular", selloID, motivoAnulacion, anuladoPor)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

func (r *RepositorioSelloCockroach) AplicarCanje(
	ctx context.Context,
	tarjetaID, reservaID string,
	sellosAUsar int,
	descripcion, creadoPor string,
) (string, error) {
	desc := any(descripcion)
	if descripcion == "" {
		desc = nil
	}
	cp := any(creadoPor)
	if creadoPor == "" {
		cp = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "canje_recompensa_aplicar",
		tarjetaID, reservaID, sellosAUsar, desc, cp)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_canje"), nil
}

// ObtenerProgramaActivo devuelve el programa de lealtad activo de la empresa.
func (r *RepositorioSelloCockroach) ObtenerProgramaActivo(ctx context.Context, empresaID string) (ProgramaInfo, error) {
	var p ProgramaInfo
	var desc *string
	err := r.pool.QueryRow(ctx,
		`SELECT id_programa, nombre, sellos_para_recompensa,
		        COALESCE(descripcion_recompensa, ''), estado
		 FROM programa_lealtad
		 WHERE id_empresa = $1 AND estado = 'ACTIVO'
		 LIMIT 1`,
		empresaID,
	).Scan(&p.ID, &p.Nombre, &p.SellosParaRecompensa, &desc, &p.Estado)
	if err != nil {
		return ProgramaInfo{}, fmt.Errorf("programa_lealtad no encontrado: %w", err)
	}
	if desc != nil {
		p.DescripcionRecompensa = *desc
	}
	return p, nil
}

// ListarTarjetas devuelve todas las tarjetas de lealtad de la empresa con info del cliente.
func (r *RepositorioSelloCockroach) ListarTarjetas(ctx context.Context, empresaID string) ([]TarjetaResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT tl.id_tarjeta, tl.id_cliente,
		        COALESCE(c.nombre, ''), COALESCE(c.telefono, ''),
		        (SELECT count(*) FROM sello s
		           WHERE s.id_tarjeta_lealtad = tl.id_tarjeta AND s.estado = 'VALIDO'),
		        (SELECT count(*) FROM canje_recompensa cr
		           WHERE cr.id_tarjeta_lealtad = tl.id_tarjeta AND cr.estado = 'APLICADO')
		 FROM tarjeta_lealtad tl
		 JOIN programa_lealtad pl ON pl.id_programa = tl.id_programa
		 LEFT JOIN cliente c ON c.id_cliente = tl.id_cliente
		 WHERE pl.id_empresa = $1
		 ORDER BY 5 DESC`,
		empresaID,
	)
	if err != nil {
		return nil, fmt.Errorf("listar tarjetas: %w", err)
	}
	defer filas.Close()

	var resultado []TarjetaResumen
	for filas.Next() {
		var t TarjetaResumen
		if err := filas.Scan(
			&t.TarjetaID, &t.ClienteID,
			&t.NombreCliente, &t.Telefono,
			&t.SellosActivos, &t.TotalCanjes,
		); err != nil {
			return nil, fmt.Errorf("escanear tarjeta: %w", err)
		}
		resultado = append(resultado, t)
	}
	if resultado == nil {
		resultado = []TarjetaResumen{}
	}
	return resultado, nil
}

// ObtenerTarjetaPorCliente devuelve la tarjeta de lealtad de un cliente específico.
func (r *RepositorioSelloCockroach) ObtenerTarjetaPorCliente(ctx context.Context, clienteID string) (TarjetaResumen, error) {
	var t TarjetaResumen
	err := r.pool.QueryRow(ctx,
		`SELECT tl.id_tarjeta, tl.id_cliente,
		        COALESCE(c.nombre, ''), COALESCE(c.telefono, ''),
		        (SELECT count(*) FROM sello s
		           WHERE s.id_tarjeta_lealtad = tl.id_tarjeta AND s.estado = 'VALIDO'),
		        (SELECT count(*) FROM canje_recompensa cr
		           WHERE cr.id_tarjeta_lealtad = tl.id_tarjeta AND cr.estado = 'APLICADO')
		 FROM tarjeta_lealtad tl
		 LEFT JOIN cliente c ON c.id_cliente = tl.id_cliente
		 WHERE tl.id_cliente = $1
		 LIMIT 1`,
		clienteID,
	).Scan(&t.TarjetaID, &t.ClienteID, &t.NombreCliente, &t.Telefono, &t.SellosActivos, &t.TotalCanjes)
	if err != nil {
		return TarjetaResumen{}, fmt.Errorf("tarjeta no encontrada para cliente %s: %w", clienteID, err)
	}
	return t, nil
}

// ListarSellosActivos devuelve los sellos activos de un cliente, más reciente primero.
func (r *RepositorioSelloCockroach) ListarSellosActivos(ctx context.Context, clienteID string) ([]SelloResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT s.id_sello, tl.id_cliente, s.id_reserva::text, s.acumulado_en::text
		 FROM sello s
		 JOIN tarjeta_lealtad tl ON tl.id_tarjeta = s.id_tarjeta_lealtad
		 WHERE tl.id_cliente = $1 AND s.estado = 'VALIDO'
		 ORDER BY s.acumulado_en DESC`,
		clienteID,
	)
	if err != nil {
		return nil, fmt.Errorf("listar sellos: %w", err)
	}
	defer filas.Close()

	var resultado []SelloResumen
	for filas.Next() {
		var s SelloResumen
		if err := filas.Scan(&s.SelloID, &s.ClienteID, &s.ReservaID, &s.CreadoEn); err != nil {
			return nil, fmt.Errorf("escanear sello: %w", err)
		}
		resultado = append(resultado, s)
	}
	if resultado == nil {
		resultado = []SelloResumen{}
	}
	return resultado, nil
}

// Crear crea un nuevo programa de lealtad para la empresa.
func (r *RepositorioSelloCockroach) Crear(
	ctx context.Context,
	empresaID, nombre string,
	sellosParaRecompensa int,
	descripcionRecompensa, creadoPor string,
) (string, error) {
	cp := any(creadoPor)
	if creadoPor == "" {
		cp = nil
	}
	resultado, err := LlamarProc(ctx, r.pool, "programa_lealtad_crear",
		empresaID, nombre, sellosParaRecompensa, descripcionRecompensa, cp)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		switch resultado.Error {
		case "EMPRESA_NO_ACTIVA":
			return "", errores.ErrEmpresaNoActiva
		case "SELLOS_DEBE_SER_POSITIVO":
			return "", errores.ErrSellosInvalidos
		case "EMPRESA_YA_TIENE_PROGRAMA_ACTIVO":
			return "", errores.ErrProgramaYaExiste
		default:
			return "", fmt.Errorf("%s", resultado.Error)
		}
	}
	return ExtraerCampo(resultado.Datos, "id_programa"), nil
}

// Verifica en tiempo de compilación que implementa las interfaces.
var _ sellos.RepositorioSello = (*RepositorioSelloCockroach)(nil)
var _ programas.RepositorioPrograma = (*RepositorioSelloCockroach)(nil)
