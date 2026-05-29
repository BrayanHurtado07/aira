-- =============================================================================
-- AIRA — Capacidad: Organización
-- Tablas: empresa · sucursal · periodo · configuracion_empresa
-- Orden de ejecución: 02 / 15
-- Dependencias externas: ninguna (empresa es raíz del tenant)
-- Motor: CockroachDB
-- =============================================================================

CREATE TABLE IF NOT EXISTS empresa (
    id_empresa             UUID         NOT NULL DEFAULT gen_random_uuid(),
    nombre                 STRING(100)  NOT NULL,
    pais                   STRING(2)    NOT NULL,
    moneda                 STRING(3)    NOT NULL,
    frecuencia_liquidacion STRING(15)   NOT NULL DEFAULT 'MENSUAL',
    estado                 STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por             UUID,
    actualizado_en         TIMESTAMPTZ,
    actualizado_por        UUID,

    CONSTRAINT pk_empresa                         PRIMARY KEY (id_empresa),
    CONSTRAINT chk_empresa_estado                 CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO')),
    CONSTRAINT chk_empresa_frecuencia_liquidacion CHECK (frecuencia_liquidacion IN ('DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL')),
    CONSTRAINT chk_empresa_pais                   CHECK (pais IN ('PE', 'AR', 'CO', 'CL', 'EC', 'BO'))
);

CREATE INDEX idx_empresa_estado ON empresa (estado);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sucursal (
    id_sucursal     UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_empresa      UUID         NOT NULL,
    nombre          STRING(100)  NOT NULL,
    direccion       STRING(200)  NOT NULL,
    zona_horaria    STRING(60)   NOT NULL,
    telefono        STRING(20),
    estado          STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por      UUID,
    actualizado_en  TIMESTAMPTZ,
    actualizado_por UUID,

    CONSTRAINT pk_sucursal          PRIMARY KEY (id_sucursal),
    CONSTRAINT fk_sucursal_empresa  FOREIGN KEY (id_empresa)
                                    REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_sucursal_estado  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO'))
);

CREATE INDEX idx_sucursal_empresa ON sucursal (id_empresa, estado);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS periodo (
    id_periodo    UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_empresa    UUID         NOT NULL,
    nombre        STRING(100)  NOT NULL,
    fecha_inicio  DATE         NOT NULL,
    fecha_fin     DATE         NOT NULL,
    estado        STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por    UUID,

    CONSTRAINT pk_periodo          PRIMARY KEY (id_periodo),
    CONSTRAINT fk_periodo_empresa  FOREIGN KEY (id_empresa)
                                   REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_periodo_estado  CHECK (estado IN ('ACTIVO', 'CERRADO', 'ELIMINADO')),
    CONSTRAINT chk_periodo_fechas  CHECK (fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_periodo_empresa ON periodo (id_empresa, estado);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS configuracion_empresa (
    id_configuracion               UUID  NOT NULL DEFAULT gen_random_uuid(),
    id_empresa                     UUID  NOT NULL,
    horas_anticipacion_cancelacion INT2  NOT NULL DEFAULT 2,
    dias_max_reserva_anticipada    INT2  NOT NULL DEFAULT 30,
    horas_recordatorio_reserva     INT2  NOT NULL DEFAULT 24,
    permite_reserva_mismo_dia      BOOL  NOT NULL DEFAULT true,
    requiere_confirmacion_manual   BOOL  NOT NULL DEFAULT false,
    actualizado_en                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_por                UUID,

    CONSTRAINT pk_configuracion_empresa          PRIMARY KEY (id_configuracion),
    CONSTRAINT fk_configuracion_empresa_empresa  FOREIGN KEY (id_empresa)
                                                 REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT uq_configuracion_empresa          UNIQUE (id_empresa),
    CONSTRAINT chk_horas_cancelacion             CHECK (horas_anticipacion_cancelacion >= 0),
    CONSTRAINT chk_dias_max_anticipacion         CHECK (dias_max_reserva_anticipada > 0)
);
