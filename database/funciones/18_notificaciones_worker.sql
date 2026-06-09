-- =============================================================================
-- AIRA — Worker de notificaciones
-- recordatorio_marcar_enviado
-- =============================================================================

-- Marca un recordatorio PENDIENTE como ENVIADO.
-- Solo opera sobre registros PENDIENTE para evitar dobles envíos.
CREATE OR REPLACE FUNCTION recordatorio_marcar_enviado(
    p_id_recordatorio UUID
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado STRING;
BEGIN
    SELECT estado INTO v_estado
    FROM recordatorio_programado
    WHERE id_recordatorio = p_id_recordatorio;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RECORDATORIO_NO_EXISTE');
    END IF;
    IF v_estado != 'PENDIENTE' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RECORDATORIO_NO_PENDIENTE',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE recordatorio_programado
    SET estado = 'ENVIADO'
    WHERE id_recordatorio = p_id_recordatorio;

    RETURN jsonb_build_object('exito', true);
END;
$$;
