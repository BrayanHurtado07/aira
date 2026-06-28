-- =============================================================================
-- AIRA — Campañas: segmentación de inactivos + despacho
-- Cierra lo que faltaba para "promo a clientes que no vienen hace N días":
--   campana_cargar_inactivos: carga masiva de clientes sin reserva en N días.
--   campana_despachar: registra el envío (log) y completa la campaña.
-- El envío real por WhatsApp lo hace un worker Go (aquí se simula en dev).
-- =============================================================================

CREATE OR REPLACE FUNCTION campana_cargar_inactivos(
    p_id_campana   UUID,
    p_dias         INT,
    p_agregado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_empresa UUID;
    v_estado     STRING;
BEGIN
    SELECT id_empresa, estado INTO v_id_empresa, v_estado
    FROM campana WHERE id_campana = p_id_campana;

    IF v_id_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EXISTE');
    END IF;
    IF v_estado != 'BORRADOR' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EN_BORRADOR',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    -- Clientes activos de la empresa SIN reserva en los últimos N días (o nunca)
    INSERT INTO destinatario_campana (id_campana, id_cliente)
    SELECT p_id_campana, c.id_cliente
    FROM cliente c
    WHERE c.id_empresa = v_id_empresa
      AND c.estado = 'ACTIVO'
      AND NOT EXISTS (
          SELECT 1 FROM reserva r
          WHERE r.id_cliente = c.id_cliente
            AND r.fecha_hora_inicio >= now() - (p_dias || ' days')::INTERVAL
      )
    ON CONFLICT DO NOTHING;

    -- El conteo lo hace la capa Go en consulta separada (CockroachDB plpgsql no ve
    -- su propia escritura previa dentro de la misma función vía pgx).
    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION campana_despachar(
    p_id_campana     UUID,
    p_despachado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM campana WHERE id_campana = p_id_campana;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_EXISTE');
    END IF;
    IF v_estado NOT IN ('BORRADOR', 'ENVIANDO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_NO_DESPACHABLE',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM destinatario_campana WHERE id_campana = p_id_campana) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CAMPANA_SIN_DESTINATARIOS');
    END IF;

    -- Simulación de envío (dev): un ENVIADO por destinatario sin envío exitoso previo.
    -- En producción un worker Go envía por WhatsApp y registra el resultado por cliente.
    INSERT INTO log_envio_campana (id_campana, id_cliente, resultado, enviado_en)
    SELECT p_id_campana, dc.id_cliente, 'ENVIADO', now()
    FROM destinatario_campana dc
    WHERE dc.id_campana = p_id_campana
      AND NOT EXISTS (
          SELECT 1 FROM log_envio_campana l
          WHERE l.id_campana = p_id_campana AND l.id_cliente = dc.id_cliente AND l.resultado = 'ENVIADO'
      );

    UPDATE campana SET estado = 'COMPLETADA', actualizado_en = now() WHERE id_campana = p_id_campana;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_despachado_por, v_id_empresa, 'campana', p_id_campana, 'ACTUALIZAR');

    -- El conteo de enviados lo hace la capa Go en consulta separada.
    RETURN jsonb_build_object('exito', true);
END;
$$;
