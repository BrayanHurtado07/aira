-- =============================================================================
-- AIRA — Reservas: marcar NO_ASISTIO
-- El estado existía en el CHECK pero era inalcanzable. Transición CONFIRMADA→NO_ASISTIO
-- (el cliente no se presentó). Mismo patrón que reserva_completar.
-- =============================================================================

CREATE OR REPLACE FUNCTION reserva_marcar_no_asistio(
    p_id_reserva  UUID,
    p_marcado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM reserva WHERE id_reserva = p_id_reserva;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_EXISTE');
    END IF;
    IF v_estado != 'CONFIRMADA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_CONFIRMADA',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE reserva
    SET estado = 'NO_ASISTIO', actualizado_en = now(), actualizado_por = p_marcado_por
    WHERE id_reserva = p_id_reserva;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_marcado_por, v_id_empresa, 'reserva', p_id_reserva, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;
