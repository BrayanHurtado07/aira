-- =============================================================================
-- AIRA — Capacidad: Monetización (cobros)
-- Tabla: pago_suscripcion (registro de cobros de suscripción vía pasarela)
-- Orden de ejecución: 17
-- Dependencias externas: empresa (02), suscripcion (04)
-- Motor: CockroachDB
-- =============================================================================

CREATE TABLE IF NOT EXISTS pago_suscripcion (
    id_pago             UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_empresa          UUID          NOT NULL,
    id_suscripcion      UUID          NOT NULL,
    monto               DECIMAL(15,2) NOT NULL,
    moneda              STRING(3)     NOT NULL,
    estado              STRING(20)    NOT NULL DEFAULT 'PENDIENTE',
    pasarela            STRING(30)    NOT NULL,
    referencia_pasarela STRING,
    concepto            STRING(160),
    creado_en           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ,

    CONSTRAINT pk_pago_suscripcion         PRIMARY KEY (id_pago),
    CONSTRAINT fk_pago_empresa             FOREIGN KEY (id_empresa)
                                           REFERENCES empresa(id_empresa)        ON DELETE RESTRICT,
    CONSTRAINT fk_pago_suscripcion         FOREIGN KEY (id_suscripcion)
                                           REFERENCES suscripcion(id_suscripcion) ON DELETE RESTRICT,
    CONSTRAINT chk_pago_estado             CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO')),
    CONSTRAINT chk_pago_monto              CHECK (monto >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pago_suscripcion ON pago_suscripcion (id_suscripcion);
CREATE INDEX IF NOT EXISTS idx_pago_empresa     ON pago_suscripcion (id_empresa, estado);
