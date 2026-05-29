-- =============================================================================
-- AIRA — Funciones de dominio: Identidad (complemento)
-- verificacion_correo_crear
-- =============================================================================

-- Crea un código de verificación de correo para un usuario.
-- El backend genera el código, lo hashea y llama esta función.
-- Invalida automáticamente cualquier código anterior no usado.
CREATE OR REPLACE FUNCTION verificacion_correo_crear(
    p_id_usuario    UUID,
    p_codigo_hash   STRING,
    p_minutos_vida  INT DEFAULT 60
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_verificacion UUID;
    v_expira_en       TIMESTAMPTZ;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'USUARIO_NO_ACTIVO');
    END IF;

    -- Invalidar códigos anteriores pendientes del mismo usuario
    UPDATE verificacion_correo_electronico
    SET usado = true
    WHERE id_usuario = p_id_usuario AND usado = false AND expira_en > now();

    v_expira_en := now() + (p_minutos_vida || ' minutes')::INTERVAL;

    INSERT INTO verificacion_correo_electronico (id_usuario, codigo_hash, expira_en, usado)
    VALUES (p_id_usuario, p_codigo_hash, v_expira_en, false)
    RETURNING id_verificacion INTO v_id_verificacion;

    INSERT INTO auditoria_accion (id_usuario, entidad, entidad_id, accion)
    VALUES (p_id_usuario, 'verificacion_correo_electronico', v_id_verificacion, 'CREAR');

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_verificacion', v_id_verificacion, 'expira_en', v_expira_en)
    );
END;
$$;
