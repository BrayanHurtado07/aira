-- =============================================================================
-- AIRA — Phone Number ID de Meta para sesion_whatsapp_empresa
-- El phone_number_id es el identificador interno de Meta (distinto al número
-- de teléfono legible). Requerido para llamar a la Cloud API.
-- =============================================================================

ALTER TABLE sesion_whatsapp_empresa
    ADD COLUMN IF NOT EXISTS id_numero_telefono_meta STRING(30);
