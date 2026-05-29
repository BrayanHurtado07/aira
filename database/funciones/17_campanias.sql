-- =============================================================================
-- AIRA — Funciones de dominio: Campañas
-- campana_crear · campana_programar · destinatario_campana_agregar
-- regla_automatizacion_crear
-- =============================================================================

CREATE OR REPLACE FUNCTION campana_crear(
    p_id_empresa       UUID,
    p_id_plantilla     UUID,
    p_nombre           STRING,
    p_tipo             STRING      DEFAULT 'MANUAL',
    p_programada_para  TIMESTAMPTZ DEFAULT NULL,
    p_creado_por       UUID        DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_campana UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM plantilla_mensaje
        WHERE id_plantilla = p_id_plantilla AND id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PLANTILLA_NO_VALIDA');
    END IF;

    IF p_programada_para IS NOT NULL AND p_programada_para <= now() THEN
        RETURN jsonb_build_object('exito', false, 'error', 'FECHA_PROGRAMADA_EN_EL_PASADO');
    END IF;

    INSERT INTO campana (
        id_empresa, id_plantilla_mensaje, nombre, tipo, estado, programada_para, creado_por
    )
    VALUES (
        p_id_empresa, p_id_plantilla, p_nombre, p_tipo, 'BORRADOR', p_programada_para, p_creado_por
    )
    RETURNING id_campana INTO v_id_campana;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'campana', v_id_campana, 'CREAR',
        jsonb_build_object('nombre', p_nombre, 'tipo', p_tipo));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_campana', v_id_campana)
    );
END;
$$;

-- -----------------------------------------------------------------------------

-- Inicia el envío de una campaña: BORRADOR → ENVIANDO.
-- Requiere al menos un destinatario antes de poder programar.
CREATE OR REPLACE FUNCTION campana_programar(
    p_id_campana     UUID,
    p_programado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM campana WHERE id_campana = p_id_campana;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EXISTE');
    END IF;
    IF v_estado != 'BORRADOR' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EN_BORRADOR',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM destinatario_campana WHERE id_campana = p_id_campana) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_SIN_DESTINATARIOS');
    END IF;

    UPDATE campana
    SET estado = 'ENVIANDO', actualizado_en = now()
    WHERE id_campana = p_id_campana;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_programado_por, v_id_empresa, 'campana', p_id_campana, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

-- Idempotente: si el cliente ya está como destinatario, retorna exito:true sin error.
CREATE OR REPLACE FUNCTION destinatario_campana_agregar(
    p_id_campana   UUID,
    p_id_cliente   UUID,
    p_agregado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_empresa UUID;
    v_estado     STRING;
BEGIN
    SELECT id_empresa, estado INTO v_id_empresa, v_estado
    FROM campana WHERE id_campana = p_id_campana;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EXISTE');
    END IF;
    IF v_estado != 'BORRADOR' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EN_BORRADOR',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM cliente
        WHERE id_cliente = p_id_cliente AND id_empresa = v_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CLIENTE_NO_VALIDO');
    END IF;

    IF EXISTS (
        SELECT 1 FROM destinatario_campana
        WHERE id_campana = p_id_campana AND id_cliente = p_id_cliente
    ) THEN
        RETURN jsonb_build_object(
            'exito', true,
            'datos', jsonb_build_object('ya_existia', true)
        );
    END IF;

    INSERT INTO destinatario_campana (id_campana, id_cliente)
    VALUES (p_id_campana, p_id_cliente);

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('ya_existia', false)
    );
END;
$$;

-- -----------------------------------------------------------------------------

-- Configura la regla de disparo para una campaña automática.
-- Una campaña puede tener múltiples reglas (se evalúan como OR).
CREATE OR REPLACE FUNCTION regla_automatizacion_crear(
    p_id_campana      UUID,
    p_condicion       STRING,
    p_parametros_json JSONB   DEFAULT NULL,
    p_creado_por      UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_regla   UUID;
    v_id_empresa UUID;
    v_tipo       STRING;
    v_estado     STRING;
BEGIN
    SELECT id_empresa, tipo, estado INTO v_id_empresa, v_tipo, v_estado
    FROM campana WHERE id_campana = p_id_campana;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EXISTE');
    END IF;
    IF v_tipo != 'AUTOMATICA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_ES_AUTOMATICA');
    END IF;
    IF v_estado != 'BORRADOR' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EN_BORRADOR',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    INSERT INTO regla_automatizacion (id_campana, condicion, parametros_json, activa)
    VALUES (p_id_campana, p_condicion, p_parametros_json, true)
    RETURNING id_regla INTO v_id_regla;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, v_id_empresa, 'regla_automatizacion', v_id_regla, 'CREAR',
        jsonb_build_object('condicion', p_condicion, 'id_campana', p_id_campana));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_regla', v_id_regla)
    );
END;
$$;
