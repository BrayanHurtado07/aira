-- =============================================================================
-- AIRA — Capacidad: Notificaciones (plantilla_mensaje)
-- Tablas: plantilla_mensaje
-- Orden de ejecución: 07 / 15
-- Dependencias externas: empresa (02)
-- Motor: CockroachDB
-- Nota: plantilla_mensaje se separa aquí porque campana (10) la necesita como FK.
--       recordatorio_programado y log_notificacion van en 13_notificaciones_resto.sql
--       porque dependen de reserva (09).
-- =============================================================================

-- plantilla_mensaje: plantilla reutilizable para WhatsApp y email.
-- variables_json define qué variables interpolables tiene la plantilla,
-- ej: {"nombre": "string", "hora": "time", "barbero": "string"}
CREATE TABLE IF NOT EXISTS plantilla_mensaje (
    id_plantilla         UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_empresa           UUID        NOT NULL,
    nombre               STRING(100) NOT NULL,
    canal                STRING(20)  NOT NULL,
    contenido_plantilla  STRING      NOT NULL,
    variables_json       JSONB,
    estado               STRING(20)  NOT NULL DEFAULT 'ACTIVO',
    creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en       TIMESTAMPTZ,
    actualizado_por      UUID,

    CONSTRAINT pk_plantilla_mensaje          PRIMARY KEY (id_plantilla),
    CONSTRAINT fk_plantilla_mensaje_empresa  FOREIGN KEY (id_empresa)
                                             REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_plantilla_mensaje_canal   CHECK (canal IN ('WHATSAPP', 'EMAIL')),
    CONSTRAINT chk_plantilla_mensaje_estado  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO'))
);

CREATE INDEX idx_plantilla_mensaje_empresa ON plantilla_mensaje (id_empresa, canal, estado);
