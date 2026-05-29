-- =============================================================================
-- AIRA — Funciones de dominio: Comisiones
-- comision_generar · liquidacion_calcular · liquidacion_aprobar · liquidacion_pagar
-- =============================================================================

-- Genera la comisión para el barbero al completar una reserva.
-- Busca el esquema de comisión activo de la empresa y calcula el monto.
CREATE OR REPLACE FUNCTION comision_generar(
    p_id_reserva   UUID,
    p_generado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_comision        UUID;
    v_id_barbero         UUID;
    v_id_empresa         UUID;
    v_estado_reserva     STRING;
    v_id_esquema         UUID;
    v_tipo_esquema       STRING;
    v_sueldo_base        DECIMAL(15,2);
    v_porcentaje         DECIMAL(5,2);
    v_total_servicios    DECIMAL(15,2);
    v_monto_calculado    DECIMAL(15,2);
BEGIN
    SELECT r.estado, r.id_barbero, r.id_empresa
    INTO v_estado_reserva, v_id_barbero, v_id_empresa
    FROM reserva r WHERE r.id_reserva = p_id_reserva;

    IF v_estado_reserva IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_EXISTE');
    END IF;
    IF v_estado_reserva != 'COMPLETADA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_COMPLETADA');
    END IF;

    -- UNIQUE (id_reserva): solo una comisión por reserva
    IF EXISTS (SELECT 1 FROM comision WHERE id_reserva = p_id_reserva) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'COMISION_YA_GENERADA');
    END IF;

    -- Obtener esquema activo de la empresa
    SELECT id_esquema, tipo, sueldo_base, porcentaje_por_servicio
    INTO v_id_esquema, v_tipo_esquema, v_sueldo_base, v_porcentaje
    FROM esquema_comision
    WHERE id_empresa = v_id_empresa AND estado = 'ACTIVO'
    ORDER BY creado_en DESC
    LIMIT 1;

    IF v_id_esquema IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ESQUEMA_COMISION_NO_ACTIVO');
    END IF;

    -- Calcular total de servicios de la reserva
    SELECT COALESCE(SUM(precio_acordado), 0) INTO v_total_servicios
    FROM reserva_servicio WHERE id_reserva = p_id_reserva;

    -- Calcular monto según tipo de esquema
    v_monto_calculado := CASE v_tipo_esquema
        WHEN 'PORCENTAJE' THEN v_total_servicios * v_porcentaje / 100
        WHEN 'FIJO'       THEN v_sueldo_base
        WHEN 'MIXTO'      THEN v_sueldo_base + (v_total_servicios * v_porcentaje / 100)
        ELSE 0
    END;

    INSERT INTO comision (id_barbero, id_reserva, id_esquema_comision, monto_calculado, estado)
    VALUES (v_id_barbero, p_id_reserva, v_id_esquema, v_monto_calculado, 'PENDIENTE')
    RETURNING id_comision INTO v_id_comision;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_generado_por, v_id_empresa, 'comision', v_id_comision, 'CREAR',
        jsonb_build_object('monto_calculado', v_monto_calculado, 'tipo_esquema', v_tipo_esquema));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_comision', v_id_comision, 'monto_calculado', v_monto_calculado)
    );
END;
$$;

-- -----------------------------------------------------------------------------

-- Calcula la liquidación de un barbero en un rango de fechas.
-- Suma todas las comisiones PENDIENTE del barbero en el período y las vincula.
CREATE OR REPLACE FUNCTION liquidacion_calcular(
    p_id_empresa    UUID,
    p_id_barbero    UUID,
    p_fecha_inicio  DATE,
    p_fecha_fin     DATE,
    p_frecuencia    STRING  DEFAULT 'MENSUAL',
    p_calculado_por UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_liquidacion UUID;
    v_monto_total    DECIMAL(15,2);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM barbero WHERE id_barbero = p_id_barbero AND id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_NO_VALIDO');
    END IF;

    IF p_fecha_fin < p_fecha_inicio THEN
        RETURN jsonb_build_object('exito', false, 'error', 'FECHA_FIN_ANTERIOR_A_INICIO');
    END IF;

    -- Sumar comisiones PENDIENTE del barbero en el rango de fechas
    SELECT COALESCE(SUM(c.monto_calculado), 0) INTO v_monto_total
    FROM comision c
    JOIN reserva r ON r.id_reserva = c.id_reserva
    WHERE c.id_barbero  = p_id_barbero
      AND c.estado      = 'PENDIENTE'
      AND r.fecha_hora_inicio::DATE BETWEEN p_fecha_inicio AND p_fecha_fin;

    INSERT INTO liquidacion (
        id_barbero, id_empresa, fecha_inicio, fecha_fin,
        monto_total, frecuencia, estado, creado_por
    )
    VALUES (
        p_id_barbero, p_id_empresa, p_fecha_inicio, p_fecha_fin,
        v_monto_total, p_frecuencia, 'CALCULADA', p_calculado_por
    )
    RETURNING id_liquidacion INTO v_id_liquidacion;

    -- Vincular comisiones a la liquidación y marcarlas
    UPDATE comision c
    SET id_liquidacion = v_id_liquidacion,
        estado         = 'INCLUIDA_EN_LIQUIDACION'
    FROM reserva r
    WHERE c.id_reserva  = r.id_reserva
      AND c.id_barbero  = p_id_barbero
      AND c.estado      = 'PENDIENTE'
      AND r.fecha_hora_inicio::DATE BETWEEN p_fecha_inicio AND p_fecha_fin;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_calculado_por, p_id_empresa, 'liquidacion', v_id_liquidacion, 'CREAR',
        jsonb_build_object('monto_total', v_monto_total, 'fecha_inicio', p_fecha_inicio,
                           'fecha_fin', p_fecha_fin));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_liquidacion', v_id_liquidacion, 'monto_total', v_monto_total)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION liquidacion_aprobar(
    p_id_liquidacion UUID,
    p_aprobado_por   UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM liquidacion WHERE id_liquidacion = p_id_liquidacion;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'LIQUIDACION_NO_EXISTE');
    END IF;
    IF v_estado != 'CALCULADA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'LIQUIDACION_NO_CALCULADA',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE liquidacion
    SET estado = 'APROBADA', actualizado_en = now(), actualizado_por = p_aprobado_por
    WHERE id_liquidacion = p_id_liquidacion;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_aprobado_por, v_id_empresa, 'liquidacion', p_id_liquidacion, 'APROBAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION liquidacion_pagar(
    p_id_liquidacion UUID,
    p_pagado_por     UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM liquidacion WHERE id_liquidacion = p_id_liquidacion;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'LIQUIDACION_NO_EXISTE');
    END IF;
    IF v_estado != 'APROBADA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'LIQUIDACION_NO_APROBADA',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE liquidacion
    SET estado = 'PAGADA', actualizado_en = now(), actualizado_por = p_pagado_por
    WHERE id_liquidacion = p_id_liquidacion;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_pagado_por, v_id_empresa, 'liquidacion', p_id_liquidacion, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;
