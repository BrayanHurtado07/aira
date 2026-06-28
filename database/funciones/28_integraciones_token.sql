-- =============================================================================
-- AIRA — Integraciones: persistencia del token de Google Calendar
-- Cierra la cadena rota: evento_calendar_registrar exige un token ACTIVO, pero
-- no existía forma de crearlo. Estas funciones guardan/revocan el token OAuth2
-- (cifrado AES-256 en la capa Go). Una integración por empresa (UNIQUE).
-- =============================================================================

CREATE OR REPLACE FUNCTION token_google_calendar_guardar(
    p_id_empresa       UUID,
    p_access_cifrado   STRING,
    p_refresh_cifrado  STRING,
    p_expira_en        TIMESTAMPTZ,
    p_correo           STRING
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_token UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    INSERT INTO token_google_calendar (
        id_empresa, access_token_cifrado, refresh_token_cifrado, expira_en, correo_propietario, estado
    ) VALUES (
        p_id_empresa, p_access_cifrado, p_refresh_cifrado, p_expira_en, p_correo, 'ACTIVO'
    )
    ON CONFLICT (id_empresa) DO UPDATE SET
        access_token_cifrado  = EXCLUDED.access_token_cifrado,
        refresh_token_cifrado = EXCLUDED.refresh_token_cifrado,
        expira_en             = EXCLUDED.expira_en,
        correo_propietario    = EXCLUDED.correo_propietario,
        estado                = 'ACTIVO',
        actualizado_en        = now()
    RETURNING id_token INTO v_id_token;

    RETURN jsonb_build_object('exito', true, 'datos', jsonb_build_object('id_token', v_id_token));
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION token_google_calendar_revocar(p_id_empresa UUID)
RETURNS JSONB LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM token_google_calendar WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'TOKEN_GOOGLE_CALENDAR_NO_ACTIVO');
    END IF;

    UPDATE token_google_calendar
    SET estado = 'REVOCADO', actualizado_en = now()
    WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO';

    RETURN jsonb_build_object('exito', true);
END;
$$;
