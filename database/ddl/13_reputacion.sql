-- =============================================================================
-- AIRA — Capacidad: Reputación
-- Tablas: resena · calificacion_barbero · calificacion_sucursal
-- Orden de ejecución: 13 / 15
-- Dependencias externas: reserva (09) · cliente (09) · empresa (02)
--                        barbero (05) · sucursal (02)
-- Motor: CockroachDB
-- =============================================================================

-- resena: una por reserva completada.
-- UNIQUE (id_reserva): evita duplicar reseñas. El stored proc valida
-- que reserva.estado = 'COMPLETADA' antes de permitir la reseña.
CREATE TABLE IF NOT EXISTS resena (
    id_resena      UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_reserva     UUID        NOT NULL,
    id_cliente     UUID        NOT NULL,
    id_empresa     UUID        NOT NULL,
    estado         STRING(20)  NOT NULL DEFAULT 'PENDIENTE',
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ,

    CONSTRAINT pk_resena          PRIMARY KEY (id_resena),
    CONSTRAINT fk_resena_reserva  FOREIGN KEY (id_reserva)
                                  REFERENCES reserva(id_reserva)   ON DELETE RESTRICT,
    CONSTRAINT fk_resena_cliente  FOREIGN KEY (id_cliente)
                                  REFERENCES cliente(id_cliente)   ON DELETE RESTRICT,
    CONSTRAINT fk_resena_empresa  FOREIGN KEY (id_empresa)
                                  REFERENCES empresa(id_empresa)   ON DELETE RESTRICT,
    CONSTRAINT chk_resena_estado  CHECK (estado IN ('PENDIENTE', 'PUBLICADA', 'MODERADA', 'ELIMINADA')),
    CONSTRAINT uq_resena_reserva  UNIQUE (id_reserva)
);

CREATE INDEX idx_resena_empresa_estado ON resena (id_empresa, estado);

-- -----------------------------------------------------------------------------

-- calificacion_barbero: puntaje del barbero dentro de la reseña.
-- UNIQUE (id_resena, id_barbero): una calificación por barbero por reseña.
CREATE TABLE IF NOT EXISTS calificacion_barbero (
    id_calificacion_barbero UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_resena               UUID        NOT NULL,
    id_barbero              UUID        NOT NULL,
    puntaje                 INT2        NOT NULL,
    comentario              STRING,
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_calificacion_barbero          PRIMARY KEY (id_calificacion_barbero),
    CONSTRAINT fk_calificacion_barbero_resena   FOREIGN KEY (id_resena)
                                                REFERENCES resena(id_resena)       ON DELETE RESTRICT,
    CONSTRAINT fk_calificacion_barbero_barbero  FOREIGN KEY (id_barbero)
                                                REFERENCES barbero(id_barbero)     ON DELETE RESTRICT,
    CONSTRAINT chk_calificacion_barbero_puntaje CHECK (puntaje BETWEEN 1 AND 5),
    CONSTRAINT uq_calificacion_barbero          UNIQUE (id_resena, id_barbero)
);

-- -----------------------------------------------------------------------------

-- calificacion_sucursal: puntaje de la sucursal dentro de la reseña.
-- UNIQUE (id_resena, id_sucursal): una calificación por sucursal por reseña.
CREATE TABLE IF NOT EXISTS calificacion_sucursal (
    id_calificacion_sucursal UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_resena                UUID        NOT NULL,
    id_sucursal              UUID        NOT NULL,
    puntaje                  INT2        NOT NULL,
    comentario               STRING,
    creado_en                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_calificacion_sucursal          PRIMARY KEY (id_calificacion_sucursal),
    CONSTRAINT fk_calificacion_sucursal_resena   FOREIGN KEY (id_resena)
                                                 REFERENCES resena(id_resena)       ON DELETE RESTRICT,
    CONSTRAINT fk_calificacion_sucursal_sucursal FOREIGN KEY (id_sucursal)
                                                 REFERENCES sucursal(id_sucursal)   ON DELETE RESTRICT,
    CONSTRAINT chk_calificacion_sucursal_puntaje CHECK (puntaje BETWEEN 1 AND 5),
    CONSTRAINT uq_calificacion_sucursal          UNIQUE (id_resena, id_sucursal)
);
