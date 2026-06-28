-- =============================================================================
-- AIRA — Monetización: registrar un cobro de suscripción
-- El cobro real lo hace la pasarela (Go); esta función solo persiste el resultado
-- de forma atómica y deja auditoría. El monto/moneda se derivan del plan vigente.
-- =============================================================================

CREATE OR REPLACE FUNCTION pago_registrar(
    p_id_suscripcion      UUID,
    p_estado              STRING,
    p_pasarela            STRING,
    p_referencia_pasarela STRING DEFAULT NULL,
    p_concepto            STRING DEFAULT NULL,
    p_registrado_por      UUID   DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_empresa     UUID;
    v_estado_susc    STRING;
    v_monto          DECIMAL(15,2);
    v_moneda         STRING;
    v_id_pago        UUID;
BEGIN
    SELECT s.id_empresa, s.estado, p.precio_mensual, p.moneda_plan
    INTO   v_id_empresa, v_estado_susc, v_monto, v_moneda
    FROM suscripcion s JOIN plan p ON p.id_plan = s.id_plan
    WHERE s.id_suscripcion = p_id_suscripcion;

    IF v_id_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUSCRIPCION_NO_EXISTE');
    END IF;
    IF v_estado_susc = 'CANCELADA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUSCRIPCION_CANCELADA');
    END IF;
    IF p_estado NOT IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ESTADO_PAGO_INVALIDO');
    END IF;

    INSERT INTO pago_suscripcion (
        id_empresa, id_suscripcion, monto, moneda, estado, pasarela, referencia_pasarela, concepto
    )
    VALUES (
        v_id_empresa, p_id_suscripcion, v_monto, v_moneda, p_estado, p_pasarela, p_referencia_pasarela, p_concepto
    )
    RETURNING id_pago INTO v_id_pago;

    -- Un pago aprobado reactiva una suscripción suspendida (al día otra vez).
    IF p_estado = 'APROBADO' AND v_estado_susc = 'SUSPENDIDA' THEN
        UPDATE suscripcion SET estado = 'ACTIVA', actualizado_en = now()
        WHERE id_suscripcion = p_id_suscripcion;
    END IF;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_registrado_por, v_id_empresa, 'pago_suscripcion', v_id_pago, 'CREAR');

    RETURN jsonb_build_object('exito', true, 'datos', jsonb_build_object(
        'id_pago', v_id_pago,
        'monto',   v_monto,
        'moneda',  v_moneda
    ));
END;
$$;
