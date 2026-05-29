-- =============================================================================
-- AIRA — Funciones de dominio: Organización
-- empresa_crear · sucursal_crear · periodo_crear
-- configuracion_empresa_guardar
-- =============================================================================

CREATE OR REPLACE FUNCTION empresa_crear(
    p_nombre                  STRING,
    p_pais                    STRING,
    p_moneda                  STRING,
    p_frecuencia_liquidacion  STRING  DEFAULT 'MENSUAL',
    p_creado_por              UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_empresa UUID;
BEGIN
    INSERT INTO empresa (nombre, pais, moneda, frecuencia_liquidacion, estado, creado_por)
    VALUES (p_nombre, upper(p_pais), upper(p_moneda), p_frecuencia_liquidacion, 'ACTIVO', p_creado_por)
    RETURNING id_empresa INTO v_id_empresa;

    -- Crear configuración por defecto para la empresa
    INSERT INTO configuracion_empresa (id_empresa)
    VALUES (v_id_empresa);

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, v_id_empresa, 'empresa', v_id_empresa, 'CREAR',
        jsonb_build_object('nombre', p_nombre, 'pais', p_pais, 'moneda', p_moneda));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_empresa', v_id_empresa)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sucursal_crear(
    p_id_empresa   UUID,
    p_nombre       STRING,
    p_direccion    STRING,
    p_zona_horaria STRING,
    p_telefono     STRING  DEFAULT NULL,
    p_creado_por   UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_sucursal UUID;
    v_estado_empresa STRING;
BEGIN
    SELECT estado INTO v_estado_empresa FROM empresa WHERE id_empresa = p_id_empresa;

    IF v_estado_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_EXISTE');
    END IF;
    IF v_estado_empresa != 'ACTIVO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    INSERT INTO sucursal (id_empresa, nombre, direccion, zona_horaria, telefono, estado, creado_por)
    VALUES (p_id_empresa, p_nombre, p_direccion, p_zona_horaria, p_telefono, 'ACTIVO', p_creado_por)
    RETURNING id_sucursal INTO v_id_sucursal;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_creado_por, p_id_empresa, 'sucursal', v_id_sucursal, 'CREAR');

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_sucursal', v_id_sucursal)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION periodo_crear(
    p_id_empresa   UUID,
    p_nombre       STRING,
    p_fecha_inicio DATE,
    p_fecha_fin    DATE,
    p_creado_por   UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_periodo UUID;
BEGIN
    IF p_fecha_fin < p_fecha_inicio THEN
        RETURN jsonb_build_object('exito', false, 'error', 'FECHA_FIN_ANTERIOR_A_INICIO');
    END IF;

    -- Validar: no hay periodo ACTIVO que se solape
    IF EXISTS (
        SELECT 1 FROM periodo
        WHERE id_empresa = p_id_empresa
          AND estado = 'ACTIVO'
          AND fecha_inicio <= p_fecha_fin
          AND fecha_fin >= p_fecha_inicio
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PERIODO_SOLAPADO_CON_UNO_ACTIVO');
    END IF;

    INSERT INTO periodo (id_empresa, nombre, fecha_inicio, fecha_fin, estado, creado_por)
    VALUES (p_id_empresa, p_nombre, p_fecha_inicio, p_fecha_fin, 'ACTIVO', p_creado_por)
    RETURNING id_periodo INTO v_id_periodo;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_creado_por, p_id_empresa, 'periodo', v_id_periodo, 'CREAR');

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_periodo', v_id_periodo)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION configuracion_empresa_guardar(
    p_id_empresa                      UUID,
    p_horas_anticipacion_cancelacion  INT,
    p_dias_max_reserva_anticipada     INT,
    p_horas_recordatorio_reserva      INT,
    p_permite_reserva_mismo_dia       BOOL,
    p_requiere_confirmacion_manual    BOOL,
    p_actualizado_por                 UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM configuracion_empresa WHERE id_empresa = p_id_empresa) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_SIN_CONFIGURACION');
    END IF;

    UPDATE configuracion_empresa
    SET horas_anticipacion_cancelacion = p_horas_anticipacion_cancelacion,
        dias_max_reserva_anticipada    = p_dias_max_reserva_anticipada,
        horas_recordatorio_reserva     = p_horas_recordatorio_reserva,
        permite_reserva_mismo_dia      = p_permite_reserva_mismo_dia,
        requiere_confirmacion_manual   = p_requiere_confirmacion_manual,
        actualizado_en                 = now(),
        actualizado_por                = p_actualizado_por
    WHERE id_empresa = p_id_empresa;

    RETURN jsonb_build_object('exito', true);
END;
$$;
