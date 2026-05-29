-- =============================================================================
-- AIRA — Capacidad: Lealtad
-- Tablas: programa_lealtad · tarjeta_lealtad · sello · canje_recompensa
-- Orden de ejecución: 12 / 15
-- Dependencias externas: empresa (02) · cliente (09) · reserva (09)
-- Motor: CockroachDB
-- =============================================================================

CREATE TABLE IF NOT EXISTS programa_lealtad (
    id_programa             UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_empresa              UUID         NOT NULL,
    nombre                  STRING(100)  NOT NULL,
    sellos_para_recompensa  INT2         NOT NULL,
    descripcion_recompensa  STRING(300)  NOT NULL,
    estado                  STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por              UUID,
    actualizado_en          TIMESTAMPTZ,

    CONSTRAINT pk_programa_lealtad          PRIMARY KEY (id_programa),
    CONSTRAINT fk_programa_lealtad_empresa  FOREIGN KEY (id_empresa)
                                            REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_programa_lealtad_estado  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO')),
    CONSTRAINT chk_programa_sellos          CHECK (sellos_para_recompensa > 0)
);

-- -----------------------------------------------------------------------------

-- tarjeta_lealtad: una por cliente por programa.
-- estado sin CANJEADA: la tarjeta no se consume tras un canje.
-- El historial de canjes vive en canje_recompensa.
-- Los sellos válidos se cuentan con COUNT(*) FROM sello WHERE estado = 'VALIDO'.
CREATE TABLE IF NOT EXISTS tarjeta_lealtad (
    id_tarjeta     UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_programa    UUID        NOT NULL,
    id_cliente     UUID        NOT NULL,
    estado         STRING(20)  NOT NULL DEFAULT 'ACTIVA',
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ,

    CONSTRAINT pk_tarjeta_lealtad                   PRIMARY KEY (id_tarjeta),
    CONSTRAINT fk_tarjeta_lealtad_programa          FOREIGN KEY (id_programa)
                                                    REFERENCES programa_lealtad(id_programa) ON DELETE RESTRICT,
    CONSTRAINT fk_tarjeta_lealtad_cliente           FOREIGN KEY (id_cliente)
                                                    REFERENCES cliente(id_cliente)           ON DELETE RESTRICT,
    CONSTRAINT chk_tarjeta_lealtad_estado           CHECK (estado IN ('ACTIVA', 'SUSPENDIDA', 'ELIMINADA')),
    CONSTRAINT uq_tarjeta_lealtad_programa_cliente  UNIQUE (id_programa, id_cliente)
);

CREATE INDEX idx_tarjeta_lealtad_cliente ON tarjeta_lealtad (id_cliente);

-- -----------------------------------------------------------------------------

-- sello: acumulado por reserva completada.
-- UNIQUE (id_reserva): un sello por reserva.
-- estado VALIDO/ANULADO: si la reserva se cancela, el sello se anula
-- mediante stored proc, no en cascada.
CREATE TABLE IF NOT EXISTS sello (
    id_sello           UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_tarjeta_lealtad UUID         NOT NULL,
    id_reserva         UUID         NOT NULL,
    estado             STRING(20)   NOT NULL DEFAULT 'VALIDO',
    acumulado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    anulado_por        UUID,
    motivo_anulacion   STRING(200),

    CONSTRAINT pk_sello                  PRIMARY KEY (id_sello),
    CONSTRAINT fk_sello_tarjeta_lealtad  FOREIGN KEY (id_tarjeta_lealtad)
                                         REFERENCES tarjeta_lealtad(id_tarjeta) ON DELETE RESTRICT,
    CONSTRAINT fk_sello_reserva          FOREIGN KEY (id_reserva)
                                         REFERENCES reserva(id_reserva)         ON DELETE RESTRICT,
    CONSTRAINT chk_sello_estado          CHECK (estado IN ('VALIDO', 'ANULADO')),
    CONSTRAINT uq_sello_reserva          UNIQUE (id_reserva)
);

CREATE INDEX idx_sello_tarjeta ON sello (id_tarjeta_lealtad, estado);

-- -----------------------------------------------------------------------------

-- canje_recompensa: historial completo de canjes.
-- Permite que la tarjeta acumule → canjee → vuelva a acumular indefinidamente.
-- Sin esta tabla solo existiría el estado binario y se perdería el historial.
CREATE TABLE IF NOT EXISTS canje_recompensa (
    id_canje                        UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_tarjeta_lealtad              UUID         NOT NULL,
    id_reserva                      UUID         NOT NULL,
    sellos_utilizados               INT2         NOT NULL,
    descripcion_recompensa_aplicada STRING(300)  NOT NULL,
    estado                          STRING(20)   NOT NULL DEFAULT 'APLICADO',
    canjeado_en                     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por                      UUID,

    CONSTRAINT pk_canje_recompensa        PRIMARY KEY (id_canje),
    CONSTRAINT fk_canje_tarjeta_lealtad   FOREIGN KEY (id_tarjeta_lealtad)
                                          REFERENCES tarjeta_lealtad(id_tarjeta) ON DELETE RESTRICT,
    CONSTRAINT fk_canje_reserva           FOREIGN KEY (id_reserva)
                                          REFERENCES reserva(id_reserva)         ON DELETE RESTRICT,
    CONSTRAINT chk_canje_estado           CHECK (estado IN ('APLICADO', 'REVERTIDO')),
    CONSTRAINT chk_canje_sellos           CHECK (sellos_utilizados > 0)
);

CREATE INDEX idx_canje_tarjeta ON canje_recompensa (id_tarjeta_lealtad, canjeado_en);
