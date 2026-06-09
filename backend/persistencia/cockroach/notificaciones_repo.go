package cockroach

import (
	"context"
	"fmt"

	"aira/capacidades/notificaciones/plantillas"
	"aira/capacidades/notificaciones/recordatorios"
	"aira/compartido/errores"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecordatorioResumen struct {
	ID            string `json:"id"`
	ReservaID     string `json:"reserva_id"`
	NombreCliente string `json:"nombre_cliente"`
	FechaReserva  string `json:"fecha_reserva"`
	EnviarEn      string `json:"enviar_en"`
	Canal         string `json:"canal"`
	Estado        string `json:"estado"`
	CreadoEn      string `json:"creado_en"`
}

type RepositorioRecordatorioCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioRecordatorio(pool *pgxpool.Pool) *RepositorioRecordatorioCockroach {
	return &RepositorioRecordatorioCockroach{pool: pool}
}

func (r *RepositorioRecordatorioCockroach) Programar(
	ctx context.Context,
	reservaID, enviarEn, canal, creadoPor string,
) (string, error) {
	cp := any(creadoPor)
	if creadoPor == "" {
		cp = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "recordatorio_programar",
		reservaID, enviarEn, canal, cp)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_recordatorio"), nil
}

func (r *RepositorioRecordatorioCockroach) ObtenerPorID(ctx context.Context, id string) (recordatorios.Recordatorio, error) {
	var rec recordatorios.Recordatorio
	err := r.pool.QueryRow(ctx,
		`SELECT id_recordatorio, id_reserva, enviar_en, canal, estado
		 FROM recordatorio_programado WHERE id_recordatorio = $1`,
		id,
	).Scan(&rec.ID, &rec.ReservaID, &rec.EnviarEn, &rec.Canal, &rec.Estado)
	if err != nil {
		return recordatorios.Recordatorio{}, errores.ErrOperacionFallida
	}
	return rec, nil
}

func (r *RepositorioRecordatorioCockroach) Cancelar(ctx context.Context, id, canceladoPor string) error {
	cp := any(canceladoPor)
	if canceladoPor == "" {
		cp = nil
	}

	resultado, err := LlamarProc(ctx, r.pool, "recordatorio_cancelar", id, cp)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

// ObtenerPendientes devuelve recordatorios cuyo envío ya venció (enviar_en <= now).
func (r *RepositorioRecordatorioCockroach) ObtenerPendientes(ctx context.Context, limite int) ([]recordatorios.RecordatorioPendiente, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT rp.id_recordatorio,
		        rv.id_empresa::text,
		        rp.canal,
		        COALESCE(c.telefono, ''),
		        COALESCE(c.nombre, ''),
		        COALESCE(e.nombre, ''),
		        COALESCE(b.nombre, ''),
		        COALESCE(rv.fecha_hora_inicio::text, '')
		 FROM recordatorio_programado rp
		 JOIN reserva rv ON rv.id_reserva = rp.id_reserva
		 JOIN cliente c  ON c.id_cliente  = rv.id_cliente
		 JOIN empresa e  ON e.id_empresa  = rv.id_empresa
		 JOIN barbero b  ON b.id_barbero  = rv.id_barbero
		 WHERE rp.estado = 'PENDIENTE'
		   AND rp.enviar_en <= now()
		 ORDER BY rp.enviar_en
		 LIMIT $1`,
		limite,
	)
	if err != nil {
		return nil, fmt.Errorf("obtener recordatorios pendientes: %w", err)
	}
	defer filas.Close()

	var resultado []recordatorios.RecordatorioPendiente
	for filas.Next() {
		var rec recordatorios.RecordatorioPendiente
		if err := filas.Scan(
			&rec.ID, &rec.EmpresaID, &rec.Canal, &rec.TelefonoCliente,
			&rec.NombreCliente, &rec.NombreBarberia,
			&rec.NombreBarbero, &rec.FechaHoraReserva,
		); err != nil {
			return nil, fmt.Errorf("escanear recordatorio pendiente: %w", err)
		}
		resultado = append(resultado, rec)
	}
	if resultado == nil {
		resultado = []recordatorios.RecordatorioPendiente{}
	}
	return resultado, nil
}

func (r *RepositorioRecordatorioCockroach) MarcarEnviado(ctx context.Context, id string) error {
	resultado, err := LlamarProc(ctx, r.pool, "recordatorio_marcar_enviado", id)
	if err != nil {
		return err
	}
	if !resultado.Exito {
		return fmt.Errorf("%s", resultado.Error)
	}
	return nil
}

// ListarPorEmpresa devuelve los recordatorios de la empresa con info del cliente y reserva.
func (r *RepositorioRecordatorioCockroach) ListarPorEmpresa(ctx context.Context, empresaID string) ([]RecordatorioResumen, error) {
	filas, err := r.pool.Query(ctx,
		`SELECT rp.id_recordatorio,
		        rp.id_reserva,
		        COALESCE(c.nombre, 'Cliente'),
		        COALESCE(rv.fecha_hora_inicio::text, ''),
		        rp.enviar_en::text,
		        rp.canal,
		        rp.estado,
		        rp.creado_en::text
		 FROM recordatorio_programado rp
		 LEFT JOIN reserva rv ON rv.id_reserva = rp.id_reserva
		 LEFT JOIN cliente c ON c.id_cliente = rv.id_cliente
		 WHERE rv.id_empresa = $1
		 ORDER BY rp.creado_en DESC
		 LIMIT 100`,
		empresaID,
	)
	if err != nil {
		return nil, fmt.Errorf("listar recordatorios: %w", err)
	}
	defer filas.Close()

	var resultado []RecordatorioResumen
	for filas.Next() {
		var rec RecordatorioResumen
		if err := filas.Scan(
			&rec.ID, &rec.ReservaID, &rec.NombreCliente,
			&rec.FechaReserva, &rec.EnviarEn, &rec.Canal,
			&rec.Estado, &rec.CreadoEn,
		); err != nil {
			return nil, fmt.Errorf("escanear recordatorio: %w", err)
		}
		resultado = append(resultado, rec)
	}
	if resultado == nil {
		resultado = []RecordatorioResumen{}
	}
	return resultado, nil
}

// Verifica en tiempo de compilación que implementa la interfaz.
var _ recordatorios.RepositorioRecordatorio = (*RepositorioRecordatorioCockroach)(nil)

// ── RepositorioPlantillaCockroach ─────────────────────────────────────────────

var _ plantillas.RepositorioPlantilla = (*RepositorioPlantillaCockroach)(nil)

type RepositorioPlantillaCockroach struct {
	pool *pgxpool.Pool
}

func NuevoRepositorioPlantilla(pool *pgxpool.Pool) *RepositorioPlantillaCockroach {
	return &RepositorioPlantillaCockroach{pool: pool}
}

func (r *RepositorioPlantillaCockroach) Guardar(
	ctx context.Context,
	p plantillas.PlantillaMensaje,
) (string, error) {
	resultado, err := LlamarProc(ctx, r.pool, "plantilla_mensaje_crear",
		p.EmpresaID, p.Nombre, p.Canal, p.ContenidoPlantilla, nil, nil)
	if err != nil {
		return "", err
	}
	if !resultado.Exito {
		return "", fmt.Errorf("%s", resultado.Error)
	}
	return ExtraerCampo(resultado.Datos, "id_plantilla_mensaje"), nil
}

func (r *RepositorioPlantillaCockroach) ListarPorEmpresa(
	ctx context.Context,
	empresaID string,
) ([]plantillas.PlantillaMensaje, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id_plantilla_mensaje, id_empresa, nombre, canal,
		        contenido_plantilla, estado
		 FROM plantilla_mensaje
		 WHERE id_empresa = $1 AND estado != 'ELIMINADO'
		 ORDER BY nombre`,
		empresaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resultado := []plantillas.PlantillaMensaje{}
	for rows.Next() {
		var p plantillas.PlantillaMensaje
		var estadoStr string
		if err := rows.Scan(&p.ID, &p.EmpresaID, &p.Nombre, &p.Canal,
			&p.ContenidoPlantilla, &estadoStr); err != nil {
			return nil, err
		}
		p.Estado = plantillas.EstadoPlantilla(estadoStr)
		resultado = append(resultado, p)
	}
	return resultado, nil
}
