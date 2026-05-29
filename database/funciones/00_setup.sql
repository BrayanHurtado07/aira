-- =============================================================================
-- AIRA — Setup previo a las funciones de dominio
-- Correcciones al DDL necesarias para que las funciones de Fase 6 funcionen
-- =============================================================================

-- auditoria_accion.id_empresa debe ser nullable:
-- las operaciones de plataforma (registrar usuario, crear empresa) ocurren
-- antes de que exista un contexto de empresa.
ALTER TABLE auditoria_accion ALTER COLUMN id_empresa DROP NOT NULL;
