-- =============================================================================
-- AIRA — Lista de espera: promover (notificar)
-- Da sentido de negocio a los estados: cuando se libera un cupo, una entrada
-- ESPERANDO pasa a NOTIFICADO (se avisó al cliente que ya hay lugar).
-- =============================================================================

CREATE OR REPLACE FUNCTION lista_espera_promover(
    p_id_lista_espera UUID,
    p_marcado_por     UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado     STRING;
    v_id_empresa UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_id_empresa
    FROM lista_espera WHERE id_lista_espera = p_id_lista_espera;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'LISTA_ESPERA_NO_EXISTE');
    END IF;
    IF v_estado != 'ESPERANDO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'LISTA_ESPERA_NO_PROMOVIBLE',
            'datos', jsonb_build_object('estado_actual', v_estado));
    END IF;

    UPDATE lista_espera
    SET estado = 'NOTIFICADO'
    WHERE id_lista_espera = p_id_lista_espera;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_marcado_por, v_id_empresa, 'lista_espera', p_id_lista_espera, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;
