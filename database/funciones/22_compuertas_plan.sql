-- =============================================================================
-- AIRA — Compuertas de plan (monetización)
-- Helpers reutilizables para que las funciones de dominio validen que la empresa
-- pague (suscripción ACTIVA) y respete los límites de su plan (plan_limite).
-- Late binding: las funciones que los invocan pueden definirse antes que estos.
-- =============================================================================

-- ¿La empresa tiene una suscripción ACTIVA? (compuerta de "pagar para operar")
CREATE OR REPLACE FUNCTION suscripcion_activa(p_id_empresa UUID)
RETURNS BOOL LANGUAGE sql AS $$
    SELECT EXISTS (
        SELECT 1 FROM suscripcion
        WHERE id_empresa = p_id_empresa AND estado = 'ACTIVA'
    );
$$;

-- Límite del concepto (MAX_SUCURSALES, MAX_BARBEROS, MAX_RESERVAS_MES, ...) para el
-- plan de la suscripción ACTIVA de la empresa. NULL = sin suscripción o sin tope definido.
CREATE OR REPLACE FUNCTION limite_plan(p_id_empresa UUID, p_concepto STRING)
RETURNS INT LANGUAGE sql AS $$
    SELECT pl.valor
    FROM suscripcion s
    JOIN plan_limite pl ON pl.id_plan = s.id_plan AND pl.concepto = p_concepto
    WHERE s.id_empresa = p_id_empresa AND s.estado = 'ACTIVA'
    LIMIT 1;
$$;
