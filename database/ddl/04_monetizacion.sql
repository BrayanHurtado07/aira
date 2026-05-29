-- =============================================================================
-- AIRA — Capacidad: Monetización
-- Tablas: plan · plan_limite · suscripcion
-- Orden de ejecución: 04 / 15
-- Dependencias externas: empresa (02)
-- Motor: CockroachDB
-- Nota: plan se crea primero porque suscripcion depende de plan y empresa
-- =============================================================================

CREATE TABLE IF NOT EXISTS plan (
    id_plan        UUID          NOT NULL DEFAULT gen_random_uuid(),
    nombre         STRING(30)    NOT NULL,
    precio_mensual DECIMAL(15,2) NOT NULL,
    moneda_plan    STRING(3)     NOT NULL,
    descripcion    STRING,
    estado         STRING(20)    NOT NULL DEFAULT 'ACTIVO',
    creado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_plan         PRIMARY KEY (id_plan),
    CONSTRAINT uq_plan_nombre  UNIQUE (nombre),
    CONSTRAINT chk_plan_nombre CHECK (nombre IN ('BASICO', 'PRO', 'ENTERPRISE')),
    CONSTRAINT chk_plan_estado CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    CONSTRAINT chk_plan_precio CHECK (precio_mensual >= 0)
);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plan_limite (
    id_plan_limite  UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_plan         UUID        NOT NULL,
    concepto        STRING(40)  NOT NULL,
    valor           INT         NOT NULL,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_plan_limite           PRIMARY KEY (id_plan_limite),
    CONSTRAINT fk_plan_limite_plan      FOREIGN KEY (id_plan)
                                        REFERENCES plan(id_plan) ON DELETE RESTRICT,
    CONSTRAINT chk_plan_limite_concepto CHECK (concepto IN (
        'MAX_SUCURSALES', 'MAX_BARBEROS', 'MAX_CAMPANAS_MES',
        'MAX_WHATSAPP_NUMEROS', 'MAX_RESERVAS_MES'
    )),
    CONSTRAINT chk_plan_limite_valor    CHECK (valor >= 0),
    CONSTRAINT uq_plan_limite_concepto  UNIQUE (id_plan, concepto)
);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS suscripcion (
    id_suscripcion   UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_empresa       UUID        NOT NULL,
    id_plan          UUID        NOT NULL,
    fecha_inicio     DATE        NOT NULL,
    fecha_renovacion DATE        NOT NULL,
    estado           STRING(20)  NOT NULL DEFAULT 'ACTIVA',
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en   TIMESTAMPTZ,

    CONSTRAINT pk_suscripcion          PRIMARY KEY (id_suscripcion),
    CONSTRAINT fk_suscripcion_empresa  FOREIGN KEY (id_empresa)
                                       REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT fk_suscripcion_plan     FOREIGN KEY (id_plan)
                                       REFERENCES plan(id_plan)       ON DELETE RESTRICT,
    CONSTRAINT chk_suscripcion_estado  CHECK (estado IN ('ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'VENCIDA')),
    CONSTRAINT chk_suscripcion_fechas  CHECK (fecha_renovacion >= fecha_inicio)
);

-- Solo una suscripción ACTIVA por empresa en cualquier momento
CREATE UNIQUE INDEX uq_suscripcion_empresa_activa ON suscripcion (id_empresa) WHERE estado = 'ACTIVA';
CREATE INDEX idx_suscripcion_empresa ON suscripcion (id_empresa, estado);
