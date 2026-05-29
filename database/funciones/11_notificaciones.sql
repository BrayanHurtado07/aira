-- =============================================================================
-- AIRA — Funciones de dominio: Notificaciones
-- recordatorio_programar · recordatorio_cancelar
-- =============================================================================

CREATE OR REPLACE FUNCTION recordatorio_programar(
    p_id_reserva  UUID,
    p_enviar_en   TIMESTAMPTZ,
    p_canal       STRING,
    p_creado_por  UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_recordatorio UUID;
    v_id_empresa      UUID;
    v_estado_reserva  STRING;
BEGIN
    SELECT r.estado, r.id_empresa
    INTO v_estado_reserva, v_id_empresa
    FROM reserva r WHERE r.id_reserva = p_id_reserva;

    IF v_estado_reserva IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_EXISTE');
    END IF;
    IF v_estado_reserva IN ('CANCELADA', 'NO_ASISTIO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_ACTIVA_PARA_RECORDATORIO');
    END IF;

    IF p_enviar_en <= now() THEN
        RETURN jsonb_build_object('exito', false, 'error', 'FECHA_ENVIO_EN_EL_PASADO');
    END IF;

    INSERT INTO recordatorio_programado (id_reserva, enviar_en, canal, estado)
    VALUES (p_id_reserva, p_enviar_en, p_canal, 'PENDIENTE')
    RETURNING id_recordatorio INTO v_id_recordatorio;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, v_id_empresa, 'recordatorio_programado', v_id_recordatorio, 'CREAR',
        jsonb_build_object('enviar_en', p_enviar_en, 'canal', p_canal));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_recordatorio', v_id_recordatorio)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION recordatorio_cancelar(
    p_id_recordatorio UUID,
    p_cancelado_por   UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_reserva UUID;
    v_id_empresa UUID;
BEGIN
    SELECT rp.estado, rp.id_reserva, r.id_empresa
    INTO v_estado, v_id_reserva, v_id_empresa
    FROM recordatorio_programado rp
    JOIN reserva r ON r.id_reserva = rp.id_reserva
    WHERE rp.id_recordatorio = p_id_recordatorio;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RECORDATORIO_NO_EXISTE');
    END IF;
    IF v_estado != 'PENDIENTE' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RECORDATORIO_NO_CANCELABLE',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE recordatorio_programado
    SET estado = 'CANCELADO'
    WHERE id_recordatorio = p_id_recordatorio;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_cancelado_por, v_id_empresa, 'recordatorio_programado', p_id_recordatorio, 'CANCELAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;
