-- =============================================================================
-- AIRA — Funciones de dominio: Reservas (complemento)
-- complemento_reserva_agregar · lista_espera_ingresar
-- =============================================================================

-- Agrega o suma producto a una reserva activa.
-- UPSERT: si el producto ya estaba en la reserva, suma la cantidad.
CREATE OR REPLACE FUNCTION complemento_reserva_agregar(
    p_id_reserva     UUID,
    p_id_producto    UUID,
    p_cantidad       DECIMAL,
    p_registrado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_empresa      UUID;
    v_estado_reserva  STRING;
    v_id_empresa_prod UUID;
BEGIN
    SELECT r.estado, r.id_empresa INTO v_estado_reserva, v_id_empresa
    FROM reserva r WHERE r.id_reserva = p_id_reserva;

    IF v_estado_reserva IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_EXISTE');
    END IF;
    IF v_estado_reserva NOT IN ('PENDIENTE', 'CONFIRMADA') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'RESERVA_NO_ACTIVA',
            'datos', jsonb_build_object('estado_actual', v_estado_reserva));
    END IF;

    IF p_cantidad <= 0 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CANTIDAD_DEBE_SER_POSITIVA');
    END IF;

    SELECT id_empresa INTO v_id_empresa_prod
    FROM producto WHERE id_producto = p_id_producto AND estado = 'ACTIVO';

    IF v_id_empresa_prod IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PRODUCTO_NO_ACTIVO');
    END IF;

    IF v_id_empresa_prod != v_id_empresa THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PRODUCTO_FUERA_DE_EMPRESA');
    END IF;

    INSERT INTO complemento_reserva (id_reserva, id_producto, cantidad)
    VALUES (p_id_reserva, p_id_producto, p_cantidad)
    ON CONFLICT (id_reserva, id_producto) DO UPDATE
        SET cantidad = complemento_reserva.cantidad + EXCLUDED.cantidad;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_registrado_por, v_id_empresa, 'complemento_reserva', p_id_reserva, 'ACTUALIZAR',
        jsonb_build_object('id_producto', p_id_producto, 'cantidad', p_cantidad));

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

-- Ingresa un cliente en la lista de espera cuando no hay disponibilidad.
-- id_barbero nullable: el cliente puede aceptar cualquier barbero disponible.
CREATE OR REPLACE FUNCTION lista_espera_ingresar(
    p_id_empresa          UUID,
    p_id_cliente          UUID,
    p_id_sucursal         UUID,
    p_id_servicio         UUID,
    p_fecha_hora_deseada  TIMESTAMPTZ,
    p_id_barbero          UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_lista_espera UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM cliente
        WHERE id_cliente = p_id_cliente AND id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CLIENTE_NO_VALIDO');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM sucursal
        WHERE id_sucursal = p_id_sucursal AND id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUCURSAL_NO_VALIDA');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM servicio
        WHERE id_servicio = p_id_servicio AND id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SERVICIO_NO_VALIDO');
    END IF;

    IF p_fecha_hora_deseada <= now() THEN
        RETURN jsonb_build_object('exito', false, 'error', 'FECHA_DEBE_SER_FUTURA');
    END IF;

    IF p_id_barbero IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM barbero
            WHERE id_barbero = p_id_barbero AND id_empresa = p_id_empresa AND estado = 'ACTIVO'
        ) THEN
            RETURN jsonb_build_object('exito', false, 'error', 'BARBERO_NO_VALIDO');
        END IF;
    END IF;

    INSERT INTO lista_espera (
        id_empresa, id_cliente, id_sucursal, id_servicio,
        id_barbero, fecha_hora_deseada, estado
    )
    VALUES (
        p_id_empresa, p_id_cliente, p_id_sucursal, p_id_servicio,
        p_id_barbero, p_fecha_hora_deseada, 'ESPERANDO'
    )
    RETURNING id_lista_espera INTO v_id_lista_espera;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (NULL, p_id_empresa, 'lista_espera', v_id_lista_espera, 'CREAR',
        jsonb_build_object('id_servicio', p_id_servicio,
                           'fecha_hora_deseada', p_fecha_hora_deseada));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_lista_espera', v_id_lista_espera)
    );
END;
$$;
