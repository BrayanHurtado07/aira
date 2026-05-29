-- =============================================================================
-- AIRA — Funciones de dominio: Reservas
-- cliente_registrar · reserva_crear · reserva_confirmar
-- reserva_cancelar · reserva_completar
-- =============================================================================

CREATE OR REPLACE FUNCTION cliente_registrar(
    p_id_empresa         UUID,
    p_nombre             STRING,
    p_telefono           STRING,
    p_correo_electronico STRING  DEFAULT NULL,
    p_fecha_nacimiento   DATE    DEFAULT NULL,
    p_creado_por         UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_cliente UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    -- UNIQUE (id_empresa, telefono): el teléfono identifica al cliente por WhatsApp
    IF EXISTS (SELECT 1 FROM cliente WHERE id_empresa = p_id_empresa AND telefono = p_telefono) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'TELEFONO_YA_REGISTRADO_EN_EMPRESA');
    END IF;

    INSERT INTO cliente (id_empresa, nombre, telefono, correo_electronico, fecha_nacimiento, estado, creado_por)
    VALUES (p_id_empresa, p_nombre, p_telefono, p_correo_electronico, p_fecha_nacimiento, 'ACTIVO', p_creado_por)
    RETURNING id_cliente INTO v_id_cliente;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'cliente', v_id_cliente, 'CREAR',
        jsonb_build_object('nombre', p_nombre, 'telefono', p_telefono));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_cliente', v_id_cliente)
    );
END;
$$;

-- -----------------------------------------------------------------------------

-- reserva_crear: función central del Core Domain.
-- Valida la cadena completa: empresa → sucursal → cliente → barbero → servicio
-- Luego verifica disponibilidad del barbero (horario, excepciones, solapamiento).
-- Aplica tarifa especial si existe para esa fecha.
-- El estado inicial depende de configuracion_empresa.requiere_confirmacion_manual.
CREATE OR REPLACE FUNCTION reserva_crear(
    p_id_empresa         UUID,
    p_id_sucursal        UUID,
    p_id_cliente         UUID,
    p_id_barbero         UUID,
    p_id_servicio        UUID,
    p_fecha_hora_inicio  TIMESTAMPTZ,
    p_origen             STRING  DEFAULT 'WHATSAPP',
    p_creado_por         UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_reserva             UUID;
    v_fecha_hora_fin         TIMESTAMPTZ;
    v_duracion_minutos       INT;
    v_precio_base            DECIMAL(15,2);
    v_precio_acordado        DECIMAL(15,2);
    v_id_periodo             UUID;
    v_zona_horaria           STRING;
    v_dia_semana             INT;
    v_hora_inicio_local      TIME;
    v_hora_fin_local         TIME;
    v_fecha_local            DATE;
    v_requiere_confirmacion  BOOL;
    v_estado_inicial         STRING;
BEGIN
    -- Validar empresa
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    -- Validar sucursal pertenece a empresa y está activa
    IF NOT EXISTS (
        SELECT 1 FROM sucursal
        WHERE id_sucursal = p_id_sucursal AND id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUCURSAL_NO_VALIDA');
    END IF;

    -- Validar cliente pertenece a empresa y está activo
    IF NOT EXISTS (
        SELECT 1 FROM cliente
        WHERE id_cliente = p_id_cliente AND id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CLIENTE_NO_VALIDO');
    END IF;

    -- Validar barbero pertenece a empresa y está activo
    IF NOT EXISTS (
        SELECT 1 FROM barbero
        WHERE id_barbero = p_id_barbero AND id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_NO_VALIDO');
    END IF;

    -- Validar servicio: obtener duración y precio base
    SELECT duracion_minutos, precio_base
    INTO v_duracion_minutos, v_precio_base
    FROM servicio
    WHERE id_servicio = p_id_servicio AND id_empresa = p_id_empresa AND estado = 'ACTIVO';

    IF v_duracion_minutos IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SERVICIO_NO_VALIDO');
    END IF;

    -- Validar que el barbero puede realizar este servicio
    IF NOT EXISTS (
        SELECT 1 FROM barbero_servicio
        WHERE id_barbero = p_id_barbero AND id_servicio = p_id_servicio
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_NO_REALIZA_ESTE_SERVICIO');
    END IF;

    -- Calcular fecha_hora_fin
    v_fecha_hora_fin := p_fecha_hora_inicio + (v_duracion_minutos || ' minutes')::INTERVAL;

    -- Validar que la fecha es futura
    IF p_fecha_hora_inicio <= now() THEN
        RETURN jsonb_build_object('exito', false, 'error', 'FECHA_DEBE_SER_FUTURA');
    END IF;

    -- Encontrar periodo ACTIVO que contenga la fecha de la reserva
    SELECT id_periodo INTO v_id_periodo
    FROM periodo
    WHERE id_empresa   = p_id_empresa
      AND estado       = 'ACTIVO'
      AND fecha_inicio <= p_fecha_hora_inicio::DATE
      AND fecha_fin    >= p_fecha_hora_inicio::DATE
    LIMIT 1;

    IF v_id_periodo IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PERIODO_NO_ENCONTRADO_PARA_ESA_FECHA');
    END IF;

    -- Obtener zona horaria de la sucursal para comparar con disponibilidad
    SELECT zona_horaria INTO v_zona_horaria FROM sucursal WHERE id_sucursal = p_id_sucursal;

    v_fecha_local       := (p_fecha_hora_inicio AT TIME ZONE v_zona_horaria)::DATE;
    v_dia_semana        := EXTRACT(DOW FROM (p_fecha_hora_inicio AT TIME ZONE v_zona_horaria))::INT;
    v_hora_inicio_local := (p_fecha_hora_inicio AT TIME ZONE v_zona_horaria)::TIME;
    v_hora_fin_local    := (v_fecha_hora_fin    AT TIME ZONE v_zona_horaria)::TIME;

    -- Verificar excepción de disponibilidad (bloqueo de día completo)
    IF EXISTS (
        SELECT 1 FROM excepcion_disponibilidad
        WHERE id_barbero  = p_id_barbero
          AND id_sucursal = p_id_sucursal
          AND fecha       = v_fecha_local
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_BLOQUEADO_EN_ESA_FECHA');
    END IF;

    -- Verificar que existe bloque de disponibilidad que contenga el turno completo
    IF NOT EXISTS (
        SELECT 1 FROM disponibilidad
        WHERE id_barbero  = p_id_barbero
          AND id_sucursal = p_id_sucursal
          AND estado      = 'ACTIVO'
          AND dia_semana  = v_dia_semana
          AND hora_inicio <= v_hora_inicio_local
          AND hora_fin    >= v_hora_fin_local
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'FUERA_DE_HORARIO_DISPONIBLE');
    END IF;

    -- Verificar solapamiento con reservas existentes del barbero
    IF EXISTS (
        SELECT 1 FROM reserva
        WHERE id_barbero          = p_id_barbero
          AND estado NOT IN ('CANCELADA', 'NO_ASISTIO')
          AND fecha_hora_inicio   < v_fecha_hora_fin
          AND fecha_hora_fin      > p_fecha_hora_inicio
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'HORARIO_OCUPADO');
    END IF;

    -- Aplicar tarifa especial si existe para esta fecha
    SELECT precio_especial INTO v_precio_acordado
    FROM tarifa_especial
    WHERE id_sucursal = p_id_sucursal
      AND id_servicio = p_id_servicio
      AND fecha       = v_fecha_local;

    IF v_precio_acordado IS NULL THEN
        v_precio_acordado := v_precio_base;
    END IF;

    -- Determinar estado inicial según configuración de la empresa
    SELECT requiere_confirmacion_manual INTO v_requiere_confirmacion
    FROM configuracion_empresa WHERE id_empresa = p_id_empresa;

    v_estado_inicial := CASE WHEN v_requiere_confirmacion THEN 'PENDIENTE' ELSE 'CONFIRMADA' END;

    INSERT INTO reserva (
        id_empresa, id_cliente, id_barbero, id_sucursal, id_periodo,
        fecha_hora_inicio, fecha_hora_fin, estado, origen, creado_por
    )
    VALUES (
        p_id_empresa, p_id_cliente, p_id_barbero, p_id_sucursal, v_id_periodo,
        p_fecha_hora_inicio, v_fecha_hora_fin, v_estado_inicial, p_origen, p_creado_por
    )
    RETURNING id_reserva INTO v_id_reserva;

    INSERT INTO reserva_servicio (id_reserva, id_servicio, precio_acordado)
    VALUES (v_id_reserva, p_id_servicio, v_precio_acordado);

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'reserva', v_id_reserva, 'CREAR',
        jsonb_build_object(
            'id_barbero', p_id_barbero, 'id_servicio', p_id_servicio,
            'fecha_hora_inicio', p_fecha_hora_inicio, 'origen', p_origen
        ));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object(
            'id_reserva',        v_id_reserva,
            'fecha_hora_fin',    v_fecha_hora_fin,
            'precio_acordado',   v_precio_acordado,
            'estado',            v_estado_inicial
        )
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reserva_confirmar(
    p_id_reserva     UUID,
    p_confirmado_por UUID DEFAULT NULL
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
    IF v_estado != 'PENDIENTE' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_PENDIENTE',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE reserva
    SET estado = 'CONFIRMADA', actualizado_en = now(), actualizado_por = p_confirmado_por
    WHERE id_reserva = p_id_reserva;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_confirmado_por, v_id_empresa, 'reserva', p_id_reserva, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reserva_cancelar(
    p_id_reserva    UUID,
    p_cancelado_por UUID DEFAULT NULL
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
    IF v_estado NOT IN ('PENDIENTE', 'CONFIRMADA') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_CANCELABLE',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE reserva
    SET estado = 'CANCELADA', actualizado_en = now(), actualizado_por = p_cancelado_por
    WHERE id_reserva = p_id_reserva;

    -- Anular sello si existía (la reserva no se completó)
    UPDATE sello SET estado = 'ANULADO', motivo_anulacion = 'RESERVA_CANCELADA'
    WHERE id_reserva = p_id_reserva AND estado = 'VALIDO';

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_cancelado_por, v_id_empresa, 'reserva', p_id_reserva, 'CANCELAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reserva_completar(
    p_id_reserva     UUID,
    p_completado_por UUID DEFAULT NULL
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
    SET estado = 'COMPLETADA', actualizado_en = now(), actualizado_por = p_completado_por
    WHERE id_reserva = p_id_reserva;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_completado_por, v_id_empresa, 'reserva', p_id_reserva, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;
