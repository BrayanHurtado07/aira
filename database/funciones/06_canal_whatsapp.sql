-- =============================================================================
-- AIRA — Funciones de dominio: Canal WhatsApp
-- conversacion_iniciar · mensaje_registrar
-- sesion_chat_iniciar · sesion_chat_actualizar
-- =============================================================================

CREATE OR REPLACE FUNCTION conversacion_iniciar(
    p_id_empresa       UUID,
    p_numero_cliente   STRING,
    p_creado_por       UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_conversacion UUID;
    v_existente       UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    -- Reutilizar conversación ACTIVA existente para el mismo número
    SELECT id_conversacion INTO v_existente
    FROM conversacion
    WHERE id_empresa        = p_id_empresa
      AND numero_cliente_wa = p_numero_cliente
      AND estado            = 'ACTIVA'
    LIMIT 1;

    IF v_existente IS NOT NULL THEN
        RETURN jsonb_build_object(
            'exito', true,
            'datos', jsonb_build_object('id_conversacion', v_existente, 'nueva', false)
        );
    END IF;

    INSERT INTO conversacion (id_empresa, numero_cliente_wa, estado)
    VALUES (p_id_empresa, p_numero_cliente, 'ACTIVA')
    RETURNING id_conversacion INTO v_id_conversacion;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_creado_por, p_id_empresa, 'conversacion', v_id_conversacion, 'CREAR');

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_conversacion', v_id_conversacion, 'nueva', true)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION mensaje_registrar(
    p_id_conversacion  UUID,
    p_contenido        STRING,
    p_tipo             STRING  DEFAULT 'TEXTO',
    p_direccion        STRING  DEFAULT 'ENTRADA',
    p_id_externo_wa    STRING  DEFAULT NULL,
    p_estado_entrega   STRING  DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_mensaje UUID;
    v_estado     STRING;
BEGIN
    SELECT estado INTO v_estado
    FROM conversacion WHERE id_conversacion = p_id_conversacion;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CONVERSACION_NO_EXISTE');
    END IF;
    IF v_estado != 'ACTIVA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CONVERSACION_NO_ACTIVA');
    END IF;

    INSERT INTO mensaje (id_conversacion, contenido, tipo, direccion, id_externo_wa, estado_entrega)
    VALUES (p_id_conversacion, p_contenido, p_tipo, p_direccion, p_id_externo_wa, p_estado_entrega)
    RETURNING id_mensaje INTO v_id_mensaje;

    -- Actualizar timestamp de la conversación
    UPDATE conversacion SET actualizado_en = now() WHERE id_conversacion = p_id_conversacion;

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_mensaje', v_id_mensaje)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sesion_chat_iniciar(
    p_id_conversacion  UUID,
    p_paso_inicial     STRING,
    p_contexto_json    JSONB       DEFAULT NULL,
    p_minutos_vida     INT         DEFAULT 30
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_sesion_chat UUID;
    v_expira_en      TIMESTAMPTZ;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM conversacion WHERE id_conversacion = p_id_conversacion AND estado = 'ACTIVA') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CONVERSACION_NO_ACTIVA');
    END IF;

    v_expira_en := now() + (p_minutos_vida || ' minutes')::INTERVAL;

    -- UPSERT: si ya existe sesion_chat para esta conversación, sobreescribir
    INSERT INTO sesion_chat (id_conversacion, paso_actual, contexto_json, expira_en)
    VALUES (p_id_conversacion, p_paso_inicial, p_contexto_json, v_expira_en)
    ON CONFLICT (id_conversacion) DO UPDATE
        SET paso_actual    = EXCLUDED.paso_actual,
            contexto_json  = EXCLUDED.contexto_json,
            expira_en      = EXCLUDED.expira_en,
            actualizado_en = now()
    RETURNING id_sesion_chat INTO v_id_sesion_chat;

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_sesion_chat', v_id_sesion_chat, 'expira_en', v_expira_en)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sesion_chat_actualizar(
    p_id_sesion_chat  UUID,
    p_paso_actual     STRING,
    p_contexto_json   JSONB   DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sesion_chat WHERE id_sesion_chat = p_id_sesion_chat) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SESION_CHAT_NO_EXISTE');
    END IF;

    UPDATE sesion_chat
    SET paso_actual    = p_paso_actual,
        contexto_json  = COALESCE(p_contexto_json, contexto_json),
        actualizado_en = now()
    WHERE id_sesion_chat = p_id_sesion_chat;

    RETURN jsonb_build_object('exito', true);
END;
$$;
