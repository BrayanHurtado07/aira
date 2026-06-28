-- =============================================================================
-- AIRA — Onboarding: aprovisionamiento inicial de una barbería
-- Deja a una empresa recién creada OPERABLE de forma atómica: le asigna una
-- suscripción ACTIVA (plan más económico), su primera sede y su primer periodo.
-- La suscripción se crea ANTES que la sede para pasar la compuerta de monetización
-- (sucursal_crear exige suscripción activa). Reusa sucursal_crear y periodo_crear.
-- =============================================================================

CREATE OR REPLACE FUNCTION empresa_aprovisionar_inicial(
    p_id_empresa    UUID,
    p_nombre_sede   STRING,
    p_direccion     STRING,
    p_zona_horaria  STRING,
    p_creado_por    UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_plan        UUID;
    v_id_suscripcion UUID;
    v_res_sede       JSONB;
    v_res_periodo    JSONB;
    v_id_sucursal    UUID;
    v_id_periodo     UUID;
    v_inicio         DATE := date_trunc('month', current_date)::DATE;
    v_fin            DATE := (date_trunc('month', current_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
    -- 1. Suscripción: plan activo más económico (debe existir al menos uno)
    IF NOT suscripcion_activa(p_id_empresa) THEN
        SELECT id_plan INTO v_id_plan
        FROM plan WHERE estado = 'ACTIVO'
        ORDER BY precio_mensual ASC LIMIT 1;

        IF v_id_plan IS NULL THEN
            RETURN jsonb_build_object('exito', false, 'error', 'PLAN_NO_DISPONIBLE');
        END IF;

        INSERT INTO suscripcion (id_empresa, id_plan, fecha_inicio, fecha_renovacion, estado)
        VALUES (p_id_empresa, v_id_plan, current_date, (current_date + INTERVAL '1 month')::DATE, 'ACTIVA')
        RETURNING id_suscripcion INTO v_id_suscripcion;
    END IF;

    -- 2. Primera sede (reusa sucursal_crear → respeta sus validaciones y compuertas)
    v_res_sede := sucursal_crear(p_id_empresa, p_nombre_sede, p_direccion, p_zona_horaria, NULL, p_creado_por);
    IF NOT (v_res_sede->>'exito')::BOOL THEN
        RETURN v_res_sede;
    END IF;
    v_id_sucursal := (v_res_sede->'datos'->>'id_sucursal')::UUID;

    -- 3. Primer periodo (mes en curso)
    v_res_periodo := periodo_crear(p_id_empresa, 'Periodo ' || to_char(current_date, 'YYYY-MM'),
                                   v_inicio, v_fin, p_creado_por);
    IF NOT (v_res_periodo->>'exito')::BOOL THEN
        RETURN v_res_periodo;
    END IF;
    v_id_periodo := (v_res_periodo->'datos'->>'id_periodo')::UUID;

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object(
            'id_sucursal',    v_id_sucursal,
            'id_periodo',     v_id_periodo,
            'id_suscripcion', v_id_suscripcion
        )
    );
END;
$$;
