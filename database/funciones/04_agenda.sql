-- =============================================================================
-- AIRA — Funciones de dominio: Agenda
-- barbero_registrar · barbero_servicio_asignar · servicio_crear
-- disponibilidad_registrar · excepcion_disponibilidad_registrar
-- =============================================================================

CREATE OR REPLACE FUNCTION barbero_registrar(
    p_id_empresa   UUID,
    p_nombre       STRING,
    p_telefono     STRING  DEFAULT NULL,
    p_id_usuario   UUID    DEFAULT NULL,
    p_foto_url     STRING  DEFAULT NULL,
    p_creado_por   UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_barbero    UUID;
    v_estado_empresa STRING;
BEGIN
    SELECT estado INTO v_estado_empresa FROM empresa WHERE id_empresa = p_id_empresa;
    IF v_estado_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_EXISTE');
    END IF;
    IF v_estado_empresa != 'ACTIVO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    IF p_id_usuario IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario AND estado = 'ACTIVO') THEN
            RETURN jsonb_build_object('exito', false, 'error', 'USUARIO_NO_ACTIVO');
        END IF;
    END IF;

    INSERT INTO barbero (id_empresa, id_usuario, nombre, telefono, foto_url, estado, creado_por)
    VALUES (p_id_empresa, p_id_usuario, p_nombre, p_telefono, p_foto_url, 'ACTIVO', p_creado_por)
    RETURNING id_barbero INTO v_id_barbero;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'barbero', v_id_barbero, 'CREAR',
        jsonb_build_object('nombre', p_nombre));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_barbero', v_id_barbero)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION barbero_servicio_asignar(
    p_id_barbero   UUID,
    p_id_servicio  UUID,
    p_asignado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_empresa_barbero  UUID;
    v_id_empresa_servicio UUID;
BEGIN
    SELECT id_empresa INTO v_id_empresa_barbero
    FROM barbero WHERE id_barbero = p_id_barbero AND estado = 'ACTIVO';
    IF v_id_empresa_barbero IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_NO_ACTIVO');
    END IF;

    SELECT id_empresa INTO v_id_empresa_servicio
    FROM servicio WHERE id_servicio = p_id_servicio AND estado = 'ACTIVO';
    IF v_id_empresa_servicio IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SERVICIO_NO_ACTIVO');
    END IF;

    IF v_id_empresa_barbero != v_id_empresa_servicio THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_Y_SERVICIO_DE_DIFERENTE_EMPRESA');
    END IF;

    IF EXISTS (SELECT 1 FROM barbero_servicio WHERE id_barbero = p_id_barbero AND id_servicio = p_id_servicio) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ASIGNACION_YA_EXISTE');
    END IF;

    INSERT INTO barbero_servicio (id_barbero, id_servicio) VALUES (p_id_barbero, p_id_servicio);

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_asignado_por, v_id_empresa_barbero, 'barbero_servicio', p_id_barbero, 'CREAR',
        jsonb_build_object('id_servicio', p_id_servicio));

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION servicio_crear(
    p_id_empresa        UUID,
    p_nombre            STRING,
    p_duracion_minutos  INT,
    p_precio_base       DECIMAL,
    p_descripcion       STRING  DEFAULT NULL,
    p_creado_por        UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_servicio UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    IF p_duracion_minutos <= 0 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'DURACION_DEBE_SER_POSITIVA');
    END IF;
    IF p_precio_base < 0 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PRECIO_NO_PUEDE_SER_NEGATIVO');
    END IF;

    INSERT INTO servicio (id_empresa, nombre, duracion_minutos, precio_base, descripcion, estado)
    VALUES (p_id_empresa, p_nombre, p_duracion_minutos::INT2, p_precio_base, p_descripcion, 'ACTIVO')
    RETURNING id_servicio INTO v_id_servicio;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'servicio', v_id_servicio, 'CREAR',
        jsonb_build_object('nombre', p_nombre, 'duracion_minutos', p_duracion_minutos,
                           'precio_base', p_precio_base));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_servicio', v_id_servicio)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION disponibilidad_registrar(
    p_id_barbero   UUID,
    p_id_sucursal  UUID,
    p_dia_semana   INT,
    p_hora_inicio  TIME,
    p_hora_fin     TIME,
    p_creado_por   UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_disponibilidad UUID;
    v_id_empresa        UUID;
BEGIN
    SELECT id_empresa INTO v_id_empresa
    FROM barbero WHERE id_barbero = p_id_barbero AND estado = 'ACTIVO';
    IF v_id_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_NO_ACTIVO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sucursal WHERE id_sucursal = p_id_sucursal AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUCURSAL_NO_ACTIVA');
    END IF;

    IF p_hora_fin <= p_hora_inicio THEN
        RETURN jsonb_build_object('exito', false, 'error', 'HORA_FIN_DEBE_SER_POSTERIOR_A_INICIO');
    END IF;

    -- Validar: no se solapa con otro bloque activo del mismo barbero/sucursal/día
    IF EXISTS (
        SELECT 1 FROM disponibilidad
        WHERE id_barbero  = p_id_barbero
          AND id_sucursal = p_id_sucursal
          AND dia_semana  = p_dia_semana
          AND estado      = 'ACTIVO'
          AND hora_inicio < p_hora_fin
          AND hora_fin    > p_hora_inicio
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'HORARIO_SOLAPADO');
    END IF;

    INSERT INTO disponibilidad (id_barbero, id_sucursal, dia_semana, hora_inicio, hora_fin, estado, creado_por)
    VALUES (p_id_barbero, p_id_sucursal, p_dia_semana::INT2, p_hora_inicio, p_hora_fin, 'ACTIVO', p_creado_por)
    RETURNING id_disponibilidad INTO v_id_disponibilidad;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, v_id_empresa, 'disponibilidad', v_id_disponibilidad, 'CREAR',
        jsonb_build_object('dia_semana', p_dia_semana, 'hora_inicio', p_hora_inicio,
                           'hora_fin', p_hora_fin));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_disponibilidad', v_id_disponibilidad)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION excepcion_disponibilidad_registrar(
    p_id_barbero   UUID,
    p_id_sucursal  UUID,
    p_fecha        DATE,
    p_motivo       STRING,
    p_descripcion  STRING DEFAULT NULL,
    p_creado_por   UUID   DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_excepcion UUID;
    v_id_empresa   UUID;
BEGIN
    SELECT id_empresa INTO v_id_empresa
    FROM barbero WHERE id_barbero = p_id_barbero AND estado = 'ACTIVO';
    IF v_id_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_NO_ACTIVO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sucursal WHERE id_sucursal = p_id_sucursal AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUCURSAL_NO_ACTIVA');
    END IF;

    -- UNIQUE (id_barbero, id_sucursal, fecha) — solo un bloqueo por día
    IF EXISTS (
        SELECT 1 FROM excepcion_disponibilidad
        WHERE id_barbero  = p_id_barbero
          AND id_sucursal = p_id_sucursal
          AND fecha       = p_fecha
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EXCEPCION_YA_REGISTRADA_PARA_ESA_FECHA');
    END IF;

    INSERT INTO excepcion_disponibilidad (id_barbero, id_sucursal, fecha, motivo, descripcion, creado_por)
    VALUES (p_id_barbero, p_id_sucursal, p_fecha, p_motivo, p_descripcion, p_creado_por)
    RETURNING id_excepcion INTO v_id_excepcion;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, v_id_empresa, 'excepcion_disponibilidad', v_id_excepcion, 'CREAR',
        jsonb_build_object('fecha', p_fecha, 'motivo', p_motivo));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_excepcion', v_id_excepcion)
    );
END;
$$;
