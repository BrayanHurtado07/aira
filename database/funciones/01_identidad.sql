-- =============================================================================
-- AIRA — Funciones de dominio: Identidad
-- usuario_registrar · usuario_iniciar_sesion · usuario_cerrar_sesion
-- usuario_verificar_correo
-- Patrón: validar estado → ejecutar → auditar → retornar JSONB
-- =============================================================================

-- -----------------------------------------------------------------------------
-- usuario_registrar
-- Registra un nuevo usuario en la plataforma. El backend hashea la contraseña
-- antes de llamar esta función. Retorna error si el correo ya existe.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION usuario_registrar(
    p_correo_electronico  STRING,
    p_contrasena_hash     STRING,
    p_nombre              STRING,
    p_telefono            STRING DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_nuevo UUID;
BEGIN
    -- Validar: correo único (normalizado a minúsculas)
    IF EXISTS (
        SELECT 1 FROM usuario WHERE correo_electronico = lower(p_correo_electronico)
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CORREO_ELECTRONICO_YA_REGISTRADO');
    END IF;

    INSERT INTO usuario (correo_electronico, contrasena_hash, nombre, telefono, estado)
    VALUES (lower(p_correo_electronico), p_contrasena_hash, p_nombre, p_telefono, 'ACTIVO')
    RETURNING id_usuario INTO v_id_nuevo;

    INSERT INTO auditoria_accion (id_usuario, entidad, entidad_id, accion)
    VALUES (v_id_nuevo, 'usuario', v_id_nuevo, 'CREAR');

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_usuario', v_id_nuevo, 'estado', 'ACTIVO')
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- usuario_iniciar_sesion
-- Valida credenciales y crea una sesión activa. El backend verifica el hash
-- de la contraseña antes de llamar esta función.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION usuario_iniciar_sesion(
    p_id_usuario        UUID,
    p_token_hash        STRING,
    p_refresh_hash      STRING,
    p_ip_origen         STRING,
    p_user_agent        STRING   DEFAULT NULL,
    p_minutos_vida      INT      DEFAULT 60
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado_usuario STRING;
    v_id_sesion      UUID;
    v_expira_en      TIMESTAMPTZ;
BEGIN
    -- Validar: usuario existe y está activo
    SELECT estado INTO v_estado_usuario
    FROM usuario WHERE id_usuario = p_id_usuario;

    IF v_estado_usuario IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'USUARIO_NO_EXISTE');
    END IF;

    IF v_estado_usuario != 'ACTIVO' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'USUARIO_NO_ACTIVO',
                                  'estado_actual', v_estado_usuario);
    END IF;

    -- Validar: token_hash único (no colisión)
    IF EXISTS (SELECT 1 FROM sesion_global WHERE token_hash = p_token_hash) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'TOKEN_YA_EXISTE');
    END IF;

    v_expira_en := now() + (p_minutos_vida || ' minutes')::INTERVAL;

    INSERT INTO sesion_global (id_usuario, token_hash, refresh_token_hash, ip_origen, user_agent, expira_en, estado)
    VALUES (p_id_usuario, p_token_hash, p_refresh_hash, p_ip_origen, p_user_agent, v_expira_en, 'ACTIVA')
    RETURNING id_sesion_global INTO v_id_sesion;

    UPDATE usuario SET actualizado_en = now() WHERE id_usuario = p_id_usuario;

    INSERT INTO auditoria_accion (id_usuario, entidad, entidad_id, accion, ip_origen)
    VALUES (p_id_usuario, 'sesion_global', v_id_sesion, 'INICIAR_SESION', p_ip_origen);

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object(
            'id_sesion_global', v_id_sesion,
            'expira_en', v_expira_en
        )
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- usuario_cerrar_sesion
-- Revoca una sesión activa.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION usuario_cerrar_sesion(
    p_id_sesion_global UUID,
    p_id_usuario       UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_estado STRING;
BEGIN
    SELECT estado INTO v_estado
    FROM sesion_global WHERE id_sesion_global = p_id_sesion_global;

    IF v_estado IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SESION_NO_EXISTE');
    END IF;

    IF v_estado != 'ACTIVA' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SESION_NO_ACTIVA',
                                  'estado_actual', v_estado);
    END IF;

    UPDATE sesion_global
    SET estado = 'REVOCADA'
    WHERE id_sesion_global = p_id_sesion_global;

    INSERT INTO auditoria_accion (id_usuario, entidad, entidad_id, accion)
    VALUES (p_id_usuario, 'sesion_global', p_id_sesion_global, 'CERRAR_SESION');

    RETURN jsonb_build_object('exito', true);
END;
$$;

-- -----------------------------------------------------------------------------
-- usuario_verificar_correo
-- Verifica el correo de un usuario usando el código hash enviado por email.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION usuario_verificar_correo(
    p_id_usuario   UUID,
    p_codigo_hash  STRING
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_verificacion UUID;
BEGIN
    -- Buscar verificación válida: no usada y no expirada
    SELECT id_verificacion INTO v_id_verificacion
    FROM verificacion_correo_electronico
    WHERE id_usuario   = p_id_usuario
      AND codigo_hash  = p_codigo_hash
      AND usado        = false
      AND expira_en    > now()
    LIMIT 1;

    IF v_id_verificacion IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CODIGO_INVALIDO_O_EXPIRADO');
    END IF;

    -- Marcar como usada
    UPDATE verificacion_correo_electronico
    SET usado = true
    WHERE id_verificacion = v_id_verificacion;

    -- Marcar correo como verificado
    UPDATE usuario
    SET correo_verificado = true, actualizado_en = now()
    WHERE id_usuario = p_id_usuario;

    INSERT INTO auditoria_accion (id_usuario, entidad, entidad_id, accion)
    VALUES (p_id_usuario, 'verificacion_correo_electronico', v_id_verificacion, 'ACTUALIZAR');

    RETURN jsonb_build_object('exito', true,
        'datos', jsonb_build_object('correo_verificado', true));
END;
$$;
