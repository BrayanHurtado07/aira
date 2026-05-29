-- =============================================================================
-- AIRA — Funciones de dominio: Monetización
-- suscripcion_activar · suscripcion_suspender · suscripcion_cancelar
-- =============================================================================

CREATE OR REPLACE FUNCTION suscripcion_activar(
    p_id_empresa      UUID,
    p_id_plan         UUID,
    p_fecha_inicio    DATE,
    p_fecha_renovacion DATE,
    p_activado_por    UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_suscripcion UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM plan WHERE id_plan = p_id_plan AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PLAN_NO_ACTIVO');
    END IF;

    IF p_fecha_renovacion < p_fecha_inicio THEN
        RETURN jsonb_build_object('exito', false, 'error', 'FECHA_RENOVACION_ANTERIOR_A_INICIO');
    END IF;

    -- Partial unique index garantiza solo una ACTIVA, pero validamos con mensaje claro
    IF EXISTS (
        SELECT 1 FROM suscripcion WHERE id_empresa = p_id_empresa AND estado = 'ACTIVA'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_YA_TIENE_SUSCRIPCION_ACTIVA');
    END IF;

    -- Suspender suscripciones anteriores en otros estados que puedan interferir
    INSERT INTO suscripcion (id_empresa, id_plan, fecha_inicio, fecha_renovacion, estado)
    VALUES (p_id_empresa, p_id_plan, p_fecha_inicio, p_fecha_renovacion, 'ACTIVA')
    RETURNING id_suscripcion INTO v_id_suscripcion;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_activado_por, p_id_empresa, 'suscripcion', v_id_suscripcion, 'CREAR',
        jsonb_build_object('id_plan', p_id_plan, 'fecha_inicio', p_fecha_inicio,
                           'fecha_renovacion', p_fecha_renovacion));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_suscripcion', v_id_suscripcion)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION suscripcion_suspender(
    p_id_suscripcion  UUID,
    p_suspendido_por  UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM suscripcion WHERE id_suscripcion = p_id_suscripcion;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUSCRIPCION_NO_EXISTE');
    END IF;
    IF v_estado != 'ACTIVA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUSCRIPCION_NO_ACTIVA',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE suscripcion
    SET estado = 'SUSPENDIDA', actualizado_en = now()
    WHERE id_suscripcion = p_id_suscripcion;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_suspendido_por, v_id_empresa, 'suscripcion', p_id_suscripcion, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION suscripcion_cancelar(
    p_id_suscripcion  UUID,
    p_cancelado_por   UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM suscripcion WHERE id_suscripcion = p_id_suscripcion;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUSCRIPCION_NO_EXISTE');
    END IF;
    IF v_estado IN ('CANCELADA', 'VENCIDA') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUSCRIPCION_YA_INACTIVA',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE suscripcion
    SET estado = 'CANCELADA', actualizado_en = now()
    WHERE id_suscripcion = p_id_suscripcion;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_cancelado_por, v_id_empresa, 'suscripcion', p_id_suscripcion, 'CANCELAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;
