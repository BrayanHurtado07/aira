-- =============================================================================
-- AIRA — Capacidad: Campañas
-- Tablas: campana · regla_automatizacion · destinatario_campana · log_envio_campana
-- Orden de ejecución: 10 / 15
-- Dependencias externas: empresa (02) · plantilla_mensaje (07) · cliente (09)
-- Motor: CockroachDB
-- =============================================================================

-- campana: una acción de comunicación masiva o automatizada.
-- programada_para nullable: solo para campañas programadas (no inmediatas).
-- Capacidad limitada por plan: MAX_CAMPANAS_MES se valida en stored proc.
CREATE TABLE IF NOT EXISTS campana (
    id_campana           UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_empresa           UUID        NOT NULL,
    id_plantilla_mensaje UUID        NOT NULL,
    nombre               STRING(100) NOT NULL,
    tipo                 STRING(20)  NOT NULL DEFAULT 'MANUAL',
    estado               STRING(20)  NOT NULL DEFAULT 'BORRADOR',
    programada_para      TIMESTAMPTZ,
    creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    creado_por           UUID,
    actualizado_en       TIMESTAMPTZ,

    CONSTRAINT pk_campana           PRIMARY KEY (id_campana),
    CONSTRAINT fk_campana_empresa   FOREIGN KEY (id_empresa)
                                    REFERENCES empresa(id_empresa)             ON DELETE RESTRICT,
    CONSTRAINT fk_campana_plantilla FOREIGN KEY (id_plantilla_mensaje)
                                    REFERENCES plantilla_mensaje(id_plantilla) ON DELETE RESTRICT,
    CONSTRAINT chk_campana_tipo     CHECK (tipo IN ('MANUAL', 'AUTOMATICA')),
    CONSTRAINT chk_campana_estado   CHECK (estado IN ('BORRADOR', 'ENVIANDO', 'COMPLETADA', 'PAUSADA', 'CANCELADA'))
);

CREATE INDEX idx_campana_empresa_estado ON campana (id_empresa, estado);

-- -----------------------------------------------------------------------------

-- regla_automatizacion: condición que dispara una campaña automática.
-- parametros_json varía por condición:
--   CUMPLEANIOS       → {"dias_anticipacion": 1}
--   INACTIVIDAD_30_DIAS → {"dias_sin_reserva": 30}
--   SELLO_ACUMULADO   → {"cantidad_sellos": 5}
CREATE TABLE IF NOT EXISTS regla_automatizacion (
    id_regla        UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_campana      UUID        NOT NULL,
    condicion       STRING(50)  NOT NULL,
    parametros_json JSONB,
    activa          BOOL        NOT NULL DEFAULT true,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_regla_automatizacion          PRIMARY KEY (id_regla),
    CONSTRAINT fk_regla_automatizacion_campana  FOREIGN KEY (id_campana)
                                                REFERENCES campana(id_campana) ON DELETE RESTRICT,
    CONSTRAINT chk_regla_condicion              CHECK (condicion IN (
        'CUMPLEANIOS', 'INACTIVIDAD_30_DIAS', 'SELLO_ACUMULADO', 'RESERVA_COMPLETADA'
    ))
);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS destinatario_campana (
    id_campana   UUID        NOT NULL,
    id_cliente   UUID        NOT NULL,
    agregado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_destinatario_campana           PRIMARY KEY (id_campana, id_cliente),
    CONSTRAINT fk_destinatario_campana_campana   FOREIGN KEY (id_campana)
                                                 REFERENCES campana(id_campana)  ON DELETE RESTRICT,
    CONSTRAINT fk_destinatario_campana_cliente   FOREIGN KEY (id_cliente)
                                                 REFERENCES cliente(id_cliente)  ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS log_envio_campana (
    id_log_envio       UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_campana         UUID        NOT NULL,
    id_cliente         UUID        NOT NULL,
    resultado          STRING(20)  NOT NULL DEFAULT 'PENDIENTE',
    enviado_en         TIMESTAMPTZ,
    error_descripcion  STRING(500),
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_log_envio_campana          PRIMARY KEY (id_log_envio),
    CONSTRAINT fk_log_envio_campana_campana  FOREIGN KEY (id_campana)
                                             REFERENCES campana(id_campana)  ON DELETE RESTRICT,
    CONSTRAINT fk_log_envio_campana_cliente  FOREIGN KEY (id_cliente)
                                             REFERENCES cliente(id_cliente)  ON DELETE RESTRICT,
    CONSTRAINT chk_log_envio_resultado       CHECK (resultado IN ('PENDIENTE', 'ENVIADO', 'FALLIDO'))
);

CREATE INDEX idx_log_envio_campana ON log_envio_campana (id_campana, resultado);
