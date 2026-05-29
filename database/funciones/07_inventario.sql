-- =============================================================================
-- AIRA — Funciones de dominio: Inventario
-- movimiento_inventario_registrar
-- =============================================================================

-- Registra un movimiento de inventario y actualiza stock_sucursal atómicamente.
-- cantidad positiva = entrada (COMPRA, DEVOLUCION)
-- cantidad negativa = salida (CONSUMO_SERVICIO, CONSUMO_COMPLEMENTO, AJUSTE)
CREATE OR REPLACE FUNCTION movimiento_inventario_registrar(
    p_id_producto      UUID,
    p_id_sucursal      UUID,
    p_tipo_movimiento  STRING,
    p_cantidad         DECIMAL,
    p_causa_descripcion STRING  DEFAULT NULL,
    p_id_reserva       UUID    DEFAULT NULL,
    p_registrado_por   UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_movimiento   UUID;
    v_stock_actual    DECIMAL;
    v_id_empresa      UUID;
BEGIN
    IF p_cantidad = 0 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CANTIDAD_NO_PUEDE_SER_CERO');
    END IF;

    SELECT id_empresa INTO v_id_empresa
    FROM producto WHERE id_producto = p_id_producto AND estado = 'ACTIVO';
    IF v_id_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PRODUCTO_NO_ACTIVO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sucursal WHERE id_sucursal = p_id_sucursal AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUCURSAL_NO_ACTIVA');
    END IF;

    -- Verificar que no dejará el stock en negativo para movimientos de salida
    IF p_cantidad < 0 THEN
        SELECT cantidad_actual INTO v_stock_actual
        FROM stock_sucursal
        WHERE id_producto = p_id_producto AND id_sucursal = p_id_sucursal;

        IF v_stock_actual IS NOT NULL AND (v_stock_actual + p_cantidad) < 0 THEN
            RETURN jsonb_build_object('exito', false, 'error', 'STOCK_INSUFICIENTE',
                'datos', jsonb_build_object('stock_actual', v_stock_actual, 'cantidad_solicitada', p_cantidad));
        END IF;
    END IF;

    INSERT INTO movimiento_inventario (
        id_producto, id_sucursal, id_reserva, tipo_movimiento,
        cantidad, causa_descripcion, registrado_por
    )
    VALUES (
        p_id_producto, p_id_sucursal, p_id_reserva, p_tipo_movimiento,
        p_cantidad, p_causa_descripcion, p_registrado_por
    )
    RETURNING id_movimiento INTO v_id_movimiento;

    -- Actualizar stock atómicamente: UPSERT sobre (id_producto, id_sucursal)
    INSERT INTO stock_sucursal (id_producto, id_sucursal, cantidad_actual, actualizado_en)
    VALUES (p_id_producto, p_id_sucursal, p_cantidad, now())
    ON CONFLICT (id_producto, id_sucursal) DO UPDATE
        SET cantidad_actual = stock_sucursal.cantidad_actual + EXCLUDED.cantidad_actual,
            actualizado_en  = now();

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_registrado_por, v_id_empresa, 'movimiento_inventario', v_id_movimiento, 'CREAR',
        jsonb_build_object('tipo', p_tipo_movimiento, 'cantidad', p_cantidad));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_movimiento', v_id_movimiento)
    );
END;
$$;
