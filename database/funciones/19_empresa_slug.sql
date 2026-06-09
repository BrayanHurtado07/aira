-- =============================================================================
-- AIRA — Slug de empresa para URL pública de reservas
-- Agrega columna slug a empresa y función de resolución
-- =============================================================================

-- Migración: añadir columna slug a empresa (idempotente)
ALTER TABLE empresa ADD COLUMN IF NOT EXISTS slug STRING(100);
CREATE UNIQUE INDEX IF NOT EXISTS uq_empresa_slug ON empresa (slug) WHERE slug IS NOT NULL;

-- Genera slug legible desde un nombre: "La Barbería del Rey" → "la-barberia-del-rey"
CREATE OR REPLACE FUNCTION generar_slug(p_nombre STRING)
RETURNS STRING LANGUAGE plpgsql AS $$
DECLARE
    v_slug STRING;
BEGIN
    v_slug := lower(p_nombre);
    v_slug := regexp_replace(v_slug, '[áàä]', 'a', 'g');
    v_slug := regexp_replace(v_slug, '[éèë]', 'e', 'g');
    v_slug := regexp_replace(v_slug, '[íìï]', 'i', 'g');
    v_slug := regexp_replace(v_slug, '[óòö]', 'o', 'g');
    v_slug := regexp_replace(v_slug, '[úùü]', 'u', 'g');
    v_slug := regexp_replace(v_slug, 'ñ', 'n', 'g');
    v_slug := regexp_replace(v_slug, '[^a-z0-9\s-]', '', 'g');
    v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
    v_slug := regexp_replace(v_slug, '-{2,}', '-', 'g');
    v_slug := btrim(v_slug, '-');
    RETURN v_slug;
END;
$$;

-- Actualiza el slug de una empresa. Si hay colisión, agrega sufijo numérico.
CREATE OR REPLACE FUNCTION empresa_actualizar_slug(
    p_id_empresa UUID,
    p_slug       STRING
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_slug_final STRING := p_slug;
    v_contador   INT    := 1;
BEGIN
    WHILE EXISTS (
        SELECT 1 FROM empresa
        WHERE slug = v_slug_final AND id_empresa != p_id_empresa
    ) LOOP
        v_slug_final := p_slug || '-' || v_contador;
        v_contador   := v_contador + 1;
    END LOOP;

    UPDATE empresa SET slug = v_slug_final WHERE id_empresa = p_id_empresa;

    RETURN jsonb_build_object('exito', true,
        'datos', jsonb_build_object('slug', v_slug_final));
END;
$$;

-- Resuelve slug → id_empresa. Retorna NULL en datos si no existe.
CREATE OR REPLACE FUNCTION empresa_resolver_slug(p_slug STRING)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id_empresa INTO v_id
    FROM empresa
    WHERE slug = p_slug AND estado = 'ACTIVO'
    LIMIT 1;

    IF v_id IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ENCONTRADA');
    END IF;

    RETURN jsonb_build_object('exito', true,
        'datos', jsonb_build_object('id_empresa', v_id));
END;
$$;

-- Rellena slugs faltantes en empresas ya existentes (migración de datos).
UPDATE empresa
SET slug = (
    SELECT sub.slug_candidato
    FROM (
        SELECT id_empresa,
               generar_slug(nombre) || CASE
                   WHEN ROW_NUMBER() OVER (PARTITION BY generar_slug(nombre) ORDER BY creado_en) = 1
                   THEN ''
                   ELSE '-' || (ROW_NUMBER() OVER (PARTITION BY generar_slug(nombre) ORDER BY creado_en) - 1)::STRING
               END AS slug_candidato
        FROM empresa
    ) sub
    WHERE sub.id_empresa = empresa.id_empresa
)
WHERE slug IS NULL;
