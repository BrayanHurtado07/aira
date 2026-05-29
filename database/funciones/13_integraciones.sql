-- =============================================================================
-- AIRA — Funciones de dominio: Integraciones
-- evento_calendar_registrar · evento_calendar_actualizar_estado
-- =============================================================================

CREATE OR REPLACE FUNCTION evento_calendar_registrar(
    p_id_reserva      UUID,
    p_id_empresa      UUID,
    p_id_google_event STRING,
    p_creado_por      UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_evento_calendar UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = p_id_reserva AND id_empresa = p_id_empresa) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_EXISTE_EN_EMPRESA');
    END IF;

    -- UNIQUE (id_reserva): un solo evento de calendar por reserva
    IF EXISTS (SELECT 1 FROM evento_calendar WHERE id_reserva = p_id_reserva) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EVENTO_CALENDAR_YA_EXISTE');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM token_google_calendar
        WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'TOKEN_GOOGLE_CALENDAR_NO_ACTIVO');
    END IF;

    INSERT INTO evento_calendar (id_reserva, id_empresa, id_google_event, estado)
    VALUES (p_id_reserva, p_id_empresa, p_id_google_event, 'CREADO')
    RETURNING id_evento_calendar INTO v_id_evento_calendar;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'evento_calendar', v_id_evento_calendar, 'CREAR',
        jsonb_build_object('id_google_event', p_id_google_event));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_evento_calendar', v_id_evento_calendar)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION evento_calendar_actualizar_estado(
    p_id_evento_calendar UUID,
    p_nuevo_estado       STRING,
    p_actualizado_por    UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado_actual STRING;
    v_id_empresa    UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado_actual, v_id_empresa
    FROM evento_calendar WHERE id_evento_calendar = p_id_evento_calendar;

    IF v_estado_actual IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EVENTO_CALENDAR_NO_EXISTE');
    END IF;

    -- Estados válidos según DDL: PENDIENTE · CREADO · ACTUALIZADO · ELIMINADO
    IF p_nuevo_estado NOT IN ('PENDIENTE', 'CREADO', 'ACTUALIZADO', 'ELIMINADO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ESTADO_INVALIDO');
    END IF;

    IF v_estado_actual = 'ELIMINADO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EVENTO_YA_ELIMINADO');
    END IF;

    UPDATE evento_calendar
    SET estado = p_nuevo_estado, actualizado_en = now()
    WHERE id_evento_calendar = p_id_evento_calendar;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_actualizado_por, v_id_empresa, 'evento_calendar', p_id_evento_calendar, 'ACTUALIZAR',
        jsonb_build_object('estado_anterior', v_estado_actual, 'estado_nuevo', p_nuevo_estado));

    RETURN jsonb_build_object('exito', true);
END;
$$;
