-- =============================================================================
-- AIRA — Funciones de dominio: Gobierno de Acceso
-- alcance_asignar · alcance_revocar
-- =============================================================================

CREATE OR REPLACE FUNCTION alcance_asignar(
    p_id_usuario   UUID,
    p_id_empresa   UUID,
    p_id_rol       UUID,
    p_id_sucursal  UUID    DEFAULT NULL,
    p_creado_por   UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_alcance     UUID;
    v_estado_usuario STRING;
    v_estado_empresa STRING;
    v_estado_rol     STRING;
BEGIN
    SELECT estado INTO v_estado_usuario FROM usuario WHERE id_usuario = p_id_usuario;
    IF v_estado_usuario IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'USUARIO_NO_EXISTE');
    END IF;
    IF v_estado_usuario != 'ACTIVO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'USUARIO_NO_ACTIVO');
    END IF;

    SELECT estado INTO v_estado_empresa FROM empresa WHERE id_empresa = p_id_empresa;
    IF v_estado_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_EXISTE');
    END IF;
    IF v_estado_empresa != 'ACTIVO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    SELECT estado INTO v_estado_rol FROM rol WHERE id_rol = p_id_rol;
    IF v_estado_rol IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ROL_NO_EXISTE');
    END IF;

    -- Validar: no hay alcance ACTIVO idéntico (mismo usuario, empresa, rol, sucursal)
    IF EXISTS (
        SELECT 1 FROM alcance
        WHERE id_usuario  = p_id_usuario
          AND id_empresa  = p_id_empresa
          AND id_rol      = p_id_rol
          AND estado      = 'ACTIVO'
          AND (id_sucursal = p_id_sucursal OR (id_sucursal IS NULL AND p_id_sucursal IS NULL))
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ALCANCE_YA_EXISTE');
    END IF;

    INSERT INTO alcance (id_usuario, id_empresa, id_rol, id_sucursal, estado, creado_por)
    VALUES (p_id_usuario, p_id_empresa, p_id_rol, p_id_sucursal, 'ACTIVO', p_creado_por)
    RETURNING id_alcance INTO v_id_alcance;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'alcance', v_id_alcance, 'CREAR',
        jsonb_build_object('id_rol', p_id_rol, 'id_sucursal', p_id_sucursal));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_alcance', v_id_alcance)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION alcance_revocar(
    p_id_alcance  UUID,
    p_revocado_por UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado    STRING;
    v_empresa   UUID;
BEGIN
    SELECT estado, id_empresa INTO v_estado, v_empresa
    FROM alcance WHERE id_alcance = p_id_alcance;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ALCANCE_NO_EXISTE');
    END IF;
    IF v_estado != 'ACTIVO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'ALCANCE_NO_ACTIVO');
    END IF;

    UPDATE alcance SET estado = 'INACTIVO' WHERE id_alcance = p_id_alcance;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion)
    VALUES (p_revocado_por, v_empresa, 'alcance', p_id_alcance, 'ANULAR');

    RETURN jsonb_build_object('exito', true);
END;
$$;
