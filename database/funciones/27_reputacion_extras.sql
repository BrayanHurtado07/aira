-- =============================================================================
-- AIRA — Reputación: registro completo de reseña + moderación
-- resena_registrar_completa: el cliente, tras un corte COMPLETADO, deja su reseña
--   calificando barbero y sucursal en una sola operación atómica (deriva barbero
--   y sucursal de la reserva). Reusa resena_crear + calificacion_*_registrar.
-- resena_actualizar_estado: el admin publica/modera/elimina una reseña.
-- =============================================================================

CREATE OR REPLACE FUNCTION resena_registrar_completa(
    p_id_reserva       UUID,
    p_puntaje_barbero  INT,
    p_puntaje_sucursal INT,
    p_comentario       STRING DEFAULT NULL,
    p_creado_por       UUID   DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_barbero  UUID;
    v_id_sucursal UUID;
    v_res         JSONB;
    v_cal         JSONB;
    v_id_resena   UUID;
BEGIN
    -- Validar puntajes ANTES de crear nada (atomicidad sin estado parcial)
    IF p_puntaje_barbero NOT BETWEEN 1 AND 5 OR p_puntaje_sucursal NOT BETWEEN 1 AND 5 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PUNTAJE_FUERA_DE_RANGO');
    END IF;

    -- Derivar barbero y sucursal de la reserva (el cliente no los envía)
    SELECT id_barbero, id_sucursal INTO v_id_barbero, v_id_sucursal
    FROM reserva WHERE id_reserva = p_id_reserva;

    -- Crear la reseña (valida reserva COMPLETADA, no duplicada, etc.)
    v_res := resena_crear(p_id_reserva, p_creado_por);
    IF NOT (v_res->>'exito')::BOOL THEN
        RETURN v_res;
    END IF;
    v_id_resena := (v_res->'datos'->>'id_resena')::UUID;

    -- Calificar barbero
    v_cal := calificacion_barbero_registrar(v_id_resena, v_id_barbero, p_puntaje_barbero, p_comentario);
    IF NOT (v_cal->>'exito')::BOOL THEN
        RETURN v_cal;
    END IF;

    -- Calificar sucursal
    v_cal := calificacion_sucursal_registrar(v_id_resena, v_id_sucursal, p_puntaje_sucursal, NULL);
    IF NOT (v_cal->>'exito')::BOOL THEN
        RETURN v_cal;
    END IF;

    RETURN jsonb_build_object('exito', true, 'datos', jsonb_build_object('id_resena', v_id_resena));
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION resena_actualizar_estado(
    p_id_resena       UUID,
    p_nuevo_estado    STRING,
    p_actualizado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM resena WHERE id_resena = p_id_resena;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESENA_NO_EXISTE');
    END IF;
    IF p_nuevo_estado NOT IN ('PUBLICADA', 'MODERADA', 'ELIMINADA') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ESTADO_RESENA_INVALIDO');
    END IF;

    UPDATE resena
    SET estado = p_nuevo_estado, actualizado_en = now()
    WHERE id_resena = p_id_resena;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_actualizado_por, v_id_empresa, 'resena', p_id_resena, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;
