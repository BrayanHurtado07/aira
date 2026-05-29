-- =============================================================================
-- AIRA — Funciones de dominio: Reputación
-- resena_crear · calificacion_barbero_registrar · calificacion_sucursal_registrar
-- =============================================================================

-- Crea la cabecera de reseña. Solo se puede crear para reservas COMPLETADAS.
-- Calificaciones de barbero y sucursal se registran con funciones separadas.
CREATE OR REPLACE FUNCTION resena_crear(
    p_id_reserva  UUID,
    p_creado_por  UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_resena  UUID;
    v_id_empresa UUID;
    v_id_cliente UUID;
    v_estado     STRING;
BEGIN
    SELECT r.estado, r.id_empresa, r.id_cliente
    INTO v_estado, v_id_empresa, v_id_cliente
    FROM reserva r WHERE r.id_reserva = p_id_reserva;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_EXISTE');
    END IF;
    IF v_estado != 'COMPLETADA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_COMPLETADA');
    END IF;

    -- UNIQUE (id_reserva): solo una reseña por reserva
    IF EXISTS (SELECT 1 FROM resena WHERE id_reserva = p_id_reserva) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESENA_YA_EXISTE');
    END IF;

    INSERT INTO resena (id_reserva, id_cliente, id_empresa, estado)
    VALUES (p_id_reserva, v_id_cliente, v_id_empresa, 'PENDIENTE')
    RETURNING id_resena INTO v_id_resena;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_creado_por, v_id_empresa, 'resena', v_id_resena, 'CREAR');

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_resena', v_id_resena)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calificacion_barbero_registrar(
    p_id_resena    UUID,
    p_id_barbero   UUID,
    p_puntaje      INT,
    p_comentario   STRING DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_calificacion UUID;
    v_id_empresa      UUID;
BEGIN
    SELECT id_empresa INTO v_id_empresa FROM resena WHERE id_resena = p_id_resena;
    IF v_id_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESENA_NO_EXISTE');
    END IF;

    IF p_puntaje NOT BETWEEN 1 AND 5 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PUNTAJE_FUERA_DE_RANGO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM barbero WHERE id_barbero = p_id_barbero AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_NO_ACTIVO');
    END IF;

    -- UNIQUE (id_resena, id_barbero)
    IF EXISTS (SELECT 1 FROM calificacion_barbero WHERE id_resena = p_id_resena AND id_barbero = p_id_barbero) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CALIFICACION_YA_REGISTRADA');
    END IF;

    INSERT INTO calificacion_barbero (id_resena, id_barbero, puntaje, comentario)
    VALUES (p_id_resena, p_id_barbero, p_puntaje::INT2, p_comentario)
    RETURNING id_calificacion_barbero INTO v_id_calificacion;

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_calificacion_barbero', v_id_calificacion)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calificacion_sucursal_registrar(
    p_id_resena    UUID,
    p_id_sucursal  UUID,
    p_puntaje      INT,
    p_comentario   STRING DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_calificacion UUID;
    v_id_empresa      UUID;
BEGIN
    SELECT id_empresa INTO v_id_empresa FROM resena WHERE id_resena = p_id_resena;
    IF v_id_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESENA_NO_EXISTE');
    END IF;

    IF p_puntaje NOT BETWEEN 1 AND 5 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PUNTAJE_FUERA_DE_RANGO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sucursal WHERE id_sucursal = p_id_sucursal AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUCURSAL_NO_ACTIVA');
    END IF;

    -- UNIQUE (id_resena, id_sucursal)
    IF EXISTS (SELECT 1 FROM calificacion_sucursal WHERE id_resena = p_id_resena AND id_sucursal = p_id_sucursal) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CALIFICACION_YA_REGISTRADA');
    END IF;

    INSERT INTO calificacion_sucursal (id_resena, id_sucursal, puntaje, comentario)
    VALUES (p_id_resena, p_id_sucursal, p_puntaje::INT2, p_comentario)
    RETURNING id_calificacion_sucursal INTO v_id_calificacion;

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_calificacion_sucursal', v_id_calificacion)
    );
END;
$$;
