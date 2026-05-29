-- =============================================================================
-- AIRA — Capacidad: Notificaciones (recordatorio_programado · log_notificacion)
-- Orden de ejecución: 14 / 15
-- Dependencias externas: reserva (09)
-- Motor: CockroachDB
-- Nota: plantilla_mensaje está en 07_notificaciones_plantilla.sql porque
--       campana (10) la necesita. recordatorio_programado va aquí porque
--       depende de reserva (09).
-- =============================================================================

-- recordatorio_programado: cuándo y por qué canal enviar el recordatorio.
-- El scheduler de la plataforma consulta: WHERE estado = 'PENDIENTE' AND enviar_en <= now()
CREATE TABLE IF NOT EXISTS recordatorio_programado (
    id_recordatorio  UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_reserva       UUID        NOT NULL,
    enviar_en        TIMESTAMPTZ NOT NULL,
    canal            STRING(20)  NOT NULL,
    estado           STRING(20)  NOT NULL DEFAULT 'PENDIENTE',
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_recordatorio_programado          PRIMARY KEY (id_recordatorio),
    CONSTRAINT fk_recordatorio_programado_reserva  FOREIGN KEY (id_reserva)
                                                   REFERENCES reserva(id_reserva) ON DELETE RESTRICT,
    CONSTRAINT chk_recordatorio_canal              CHECK (canal IN ('WHATSAPP', 'EMAIL')),
    CONSTRAINT chk_recordatorio_estado             CHECK (estado IN ('PENDIENTE', 'ENVIADO', 'FALLIDO', 'CANCELADO'))
);

-- Índice crítico para el scheduler: recupera todos los recordatorios pendientes
-- que ya vencieron su enviar_en
CREATE INDEX idx_recordatorio_estado_enviar ON recordatorio_programado (estado, enviar_en);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS log_notificacion (
    id_log_notificacion  UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_recordatorio      UUID         NOT NULL,
    resultado            STRING(20)   NOT NULL,
    enviado_en           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    error_descripcion    STRING(500),

    CONSTRAINT pk_log_notificacion               PRIMARY KEY (id_log_notificacion),
    CONSTRAINT fk_log_notificacion_recordatorio  FOREIGN KEY (id_recordatorio)
                                                 REFERENCES recordatorio_programado(id_recordatorio) ON DELETE RESTRICT,
    CONSTRAINT chk_log_notificacion_resultado    CHECK (resultado IN ('ENVIADO', 'FALLIDO'))
);
