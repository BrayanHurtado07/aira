-- =============================================================================
-- AIRA — Funciones de dominio: Lealtad
-- sello_acumular · sello_anular · canje_recompensa_aplicar
-- =============================================================================

-- Acumula un sello para el cliente de una reserva completada.
-- Busca o crea la tarjeta del programa activo de la empresa.
CREATE OR REPLACE FUNCTION sello_acumular(
    p_id_empresa     UUID,
    p_id_cliente     UUID,
    p_id_reserva     UUID,
    p_registrado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_programa  UUID;
    v_id_tarjeta   UUID;
    v_id_sello     UUID;
    v_estado_res   STRING;
BEGIN
    SELECT estado INTO v_estado_res FROM reserva WHERE id_reserva = p_id_reserva;
    IF v_estado_res IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_EXISTE');
    END IF;
    IF v_estado_res != 'COMPLETADA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_COMPLETADA');
    END IF;

    -- Ya tiene sello esta reserva?
    IF EXISTS (SELECT 1 FROM sello WHERE id_reserva = p_id_reserva) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SELLO_YA_ACUMULADO');
    END IF;

    -- Programa activo de la empresa
    SELECT id_programa INTO v_id_programa
    FROM programa_lealtad
    WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO'
    LIMIT 1;

    IF v_id_programa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PROGRAMA_LEALTAD_NO_ACTIVO');
    END IF;

    -- Buscar o crear tarjeta del cliente para este programa
    SELECT id_tarjeta INTO v_id_tarjeta
    FROM tarjeta_lealtad
    WHERE id_programa = v_id_programa AND id_cliente = p_id_cliente AND estado = 'ACTIVA';

    IF v_id_tarjeta IS NULL THEN
        INSERT INTO tarjeta_lealtad (id_programa, id_cliente, estado)
        VALUES (v_id_programa, p_id_cliente, 'ACTIVA')
        RETURNING id_tarjeta INTO v_id_tarjeta;
    END IF;

    INSERT INTO sello (id_tarjeta_lealtad, id_reserva, estado)
    VALUES (v_id_tarjeta, p_id_reserva, 'VALIDO')
    RETURNING id_sello INTO v_id_sello;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_registrado_por, p_id_empresa, 'sello', v_id_sello, 'CREAR',
        jsonb_build_object('id_tarjeta', v_id_tarjeta, 'id_reserva', p_id_reserva));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_sello', v_id_sello, 'id_tarjeta', v_id_tarjeta)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sello_anular(
    p_id_sello        UUID,
    p_motivo_anulacion STRING,
    p_anulado_por     UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado    STRING;
    v_id_tarjeta UUID;
    v_id_empresa UUID;
BEGIN
    SELECT s.estado, s.id_tarjeta_lealtad, tl.id_programa
    INTO v_estado, v_id_tarjeta, v_id_empresa
    FROM sello s
    JOIN tarjeta_lealtad tl ON tl.id_tarjeta = s.id_tarjeta_lealtad
    JOIN programa_lealtad pl ON pl.id_programa = tl.id_programa
    WHERE s.id_sello = p_id_sello;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SELLO_NO_EXISTE');
    END IF;
    IF v_estado != 'VALIDO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SELLO_NO_ANULABLE',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE sello
    SET estado           = 'ANULADO',
        anulado_por      = p_anulado_por,
        motivo_anulacion = p_motivo_anulacion
    WHERE id_sello = p_id_sello;

    -- Obtener id_empresa desde programa_lealtad para auditoría
    SELECT pl.id_empresa INTO v_id_empresa
    FROM tarjeta_lealtad tl
    JOIN programa_lealtad pl ON pl.id_programa = tl.id_programa
    WHERE tl.id_tarjeta = v_id_tarjeta;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_anulado_por, v_id_empresa, 'sello', p_id_sello, 'ANULAR',
        jsonb_build_object('motivo', p_motivo_anulacion));

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

-- Aplica un canje de recompensa deduciendo sellos de la tarjeta.
-- Valida que el cliente tenga sellos válidos suficientes.
CREATE OR REPLACE FUNCTION canje_recompensa_aplicar(
    p_id_tarjeta    UUID,
    p_id_reserva    UUID,
    p_sellos_a_usar INT,
    p_descripcion   STRING,
    p_creado_por    UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_canje       UUID;
    v_sellos_validos INT;
    v_id_empresa     UUID;
    v_estado_tarjeta STRING;
BEGIN
    SELECT tl.estado, pl.id_empresa
    INTO v_estado_tarjeta, v_id_empresa
    FROM tarjeta_lealtad tl
    JOIN programa_lealtad pl ON pl.id_programa = tl.id_programa
    WHERE tl.id_tarjeta = p_id_tarjeta;

    IF v_estado_tarjeta IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'TARJETA_NO_EXISTE');
    END IF;
    IF v_estado_tarjeta != 'ACTIVA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'TARJETA_NO_ACTIVA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = p_id_reserva AND estado = 'COMPLETADA') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_COMPLETADA');
    END IF;

    SELECT COUNT(*) INTO v_sellos_validos
    FROM sello WHERE id_tarjeta_lealtad = p_id_tarjeta AND estado = 'VALIDO';

    IF v_sellos_validos < p_sellos_a_usar THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SELLOS_INSUFICIENTES',
            'datos', jsonb_build_object('sellos_validos', v_sellos_validos,
                                        'sellos_requeridos', p_sellos_a_usar));
    END IF;

    INSERT INTO canje_recompensa (
        id_tarjeta_lealtad, id_reserva, sellos_utilizados,
        descripcion_recompensa_aplicada, estado, creado_por
    )
    VALUES (p_id_tarjeta, p_id_reserva, p_sellos_a_usar::INT2, p_descripcion, 'APLICADO', p_creado_por)
    RETURNING id_canje INTO v_id_canje;

    -- Anular los sellos utilizados (los más antiguos primero)
    WITH sellos_a_anular AS (
        SELECT id_sello FROM sello
        WHERE id_tarjeta_lealtad = p_id_tarjeta AND estado = 'VALIDO'
        ORDER BY acumulado_en ASC
        LIMIT p_sellos_a_usar
    )
    UPDATE sello SET estado = 'ANULADO', motivo_anulacion = 'CANJEADO'
    WHERE id_sello IN (SELECT id_sello FROM sellos_a_anular);

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, v_id_empresa, 'canje_recompensa', v_id_canje, 'CREAR',
        jsonb_build_object('sellos_utilizados', p_sellos_a_usar, 'id_reserva', p_id_reserva));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_canje', v_id_canje)
    );
END;
$$;
