-- =============================================================================
-- AIRA — Capacidad: Comisiones
-- Tablas: esquema_comision · liquidacion · comision
-- Orden de ejecución: 11 / 15
-- Dependencias externas: empresa (02) · barbero (05) · reserva (09)
-- Motor: CockroachDB
-- Nota: liquidacion se crea ANTES que comision porque comision tiene FK
--       nullable a liquidacion. Sin esto, no se puede añadir la FK.
-- =============================================================================

CREATE TABLE IF NOT EXISTS esquema_comision (
    id_esquema               UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_empresa               UUID          NOT NULL,
    nombre                   STRING(100)   NOT NULL,
    tipo                     STRING(20)    NOT NULL DEFAULT 'PORCENTAJE',
    sueldo_base              DECIMAL(15,2) NOT NULL DEFAULT 0,
    porcentaje_por_servicio  DECIMAL(5,2)  NOT NULL DEFAULT 0,
    descripcion              STRING,
    estado                   STRING(20)    NOT NULL DEFAULT 'ACTIVO',
    creado_en                TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_esquema_comision          PRIMARY KEY (id_esquema),
    CONSTRAINT fk_esquema_comision_empresa  FOREIGN KEY (id_empresa)
                                            REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_esquema_comision_tipo    CHECK (tipo IN ('PORCENTAJE', 'FIJO', 'MIXTO')),
    CONSTRAINT chk_esquema_comision_estado  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO')),
    CONSTRAINT chk_esquema_sueldo           CHECK (sueldo_base >= 0),
    CONSTRAINT chk_esquema_porcentaje       CHECK (porcentaje_por_servicio BETWEEN 0 AND 100)
);

-- -----------------------------------------------------------------------------

-- liquidacion: snapshot congelado del monto al momento de aprobar.
-- monto_total es denormalización aceptada (igual que precio_acordado):
-- una vez APROBADA, el monto no debe cambiar aunque se anulen comisiones.
CREATE TABLE IF NOT EXISTS liquidacion (
    id_liquidacion   UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_barbero       UUID          NOT NULL,
    id_empresa       UUID          NOT NULL,
    fecha_inicio     DATE          NOT NULL,
    fecha_fin        DATE          NOT NULL,
    monto_total      DECIMAL(15,2) NOT NULL,
    frecuencia       STRING(15)    NOT NULL,
    estado           STRING(20)    NOT NULL DEFAULT 'CALCULADA',
    creado_en        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    creado_por       UUID,
    actualizado_en   TIMESTAMPTZ,
    actualizado_por  UUID,

    CONSTRAINT pk_liquidacion             PRIMARY KEY (id_liquidacion),
    CONSTRAINT fk_liquidacion_barbero     FOREIGN KEY (id_barbero)
                                          REFERENCES barbero(id_barbero)   ON DELETE RESTRICT,
    CONSTRAINT fk_liquidacion_empresa     FOREIGN KEY (id_empresa)
                                          REFERENCES empresa(id_empresa)   ON DELETE RESTRICT,
    CONSTRAINT chk_liquidacion_estado     CHECK (estado IN ('CALCULADA', 'APROBADA', 'PAGADA')),
    CONSTRAINT chk_liquidacion_frecuencia CHECK (frecuencia IN ('DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL')),
    CONSTRAINT chk_liquidacion_fechas     CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_liquidacion_monto      CHECK (monto_total >= 0)
);

CREATE INDEX idx_liquidacion_barbero_estado ON liquidacion (id_barbero, estado);
CREATE INDEX idx_liquidacion_empresa        ON liquidacion (id_empresa, fecha_inicio DESC);

-- -----------------------------------------------------------------------------

-- comision: una por reserva completada, por barbero.
-- id_liquidacion nullable: NULL = PENDIENTE, se llena al incluirla en liquidacion.
-- UNIQUE (id_reserva): una sola comisión por reserva.
CREATE TABLE IF NOT EXISTS comision (
    id_comision          UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_barbero           UUID          NOT NULL,
    id_reserva           UUID          NOT NULL,
    id_esquema_comision  UUID          NOT NULL,
    id_liquidacion       UUID,
    monto_calculado      DECIMAL(15,2) NOT NULL,
    estado               STRING(30)    NOT NULL DEFAULT 'PENDIENTE',
    generado_en          TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_comision              PRIMARY KEY (id_comision),
    CONSTRAINT fk_comision_barbero      FOREIGN KEY (id_barbero)
                                        REFERENCES barbero(id_barbero)               ON DELETE RESTRICT,
    CONSTRAINT fk_comision_reserva      FOREIGN KEY (id_reserva)
                                        REFERENCES reserva(id_reserva)               ON DELETE RESTRICT,
    CONSTRAINT fk_comision_esquema      FOREIGN KEY (id_esquema_comision)
                                        REFERENCES esquema_comision(id_esquema)      ON DELETE RESTRICT,
    CONSTRAINT fk_comision_liquidacion  FOREIGN KEY (id_liquidacion)
                                        REFERENCES liquidacion(id_liquidacion)       ON DELETE RESTRICT,
    CONSTRAINT chk_comision_estado      CHECK (estado IN ('PENDIENTE', 'INCLUIDA_EN_LIQUIDACION', 'ANULADA')),
    CONSTRAINT chk_comision_monto       CHECK (monto_calculado >= 0),
    CONSTRAINT uq_comision_reserva      UNIQUE (id_reserva)
);

CREATE INDEX idx_comision_barbero_estado ON comision (id_barbero, estado);
CREATE INDEX idx_comision_liquidacion    ON comision (id_liquidacion);
