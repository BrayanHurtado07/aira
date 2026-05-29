-- =============================================================================
-- AIRA — Capacidad: Integraciones
-- Tablas: token_google_calendar · evento_calendar
-- Orden de ejecución: 16 / 15 (se ejecuta al final porque evento_calendar
--                               depende de reserva)
-- Dependencias externas: empresa (02) · reserva (09)
-- Motor: CockroachDB
-- =============================================================================

-- token_google_calendar: credencial OAuth2 de la empresa para Google Calendar.
-- access_token_cifrado y refresh_token_cifrado usan AES-256 en capa de aplicación.
-- Se necesita el valor real (no hash) para llamar a la API de Google.
-- UNIQUE (id_empresa): una integración de Calendar por empresa.
CREATE TABLE IF NOT EXISTS token_google_calendar (
    id_token               UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_empresa             UUID         NOT NULL,
    access_token_cifrado   STRING       NOT NULL,
    refresh_token_cifrado  STRING       NOT NULL,
    expira_en              TIMESTAMPTZ  NOT NULL,
    correo_propietario     STRING(100)  NOT NULL,
    estado                 STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en         TIMESTAMPTZ,

    CONSTRAINT pk_token_google_calendar          PRIMARY KEY (id_token),
    CONSTRAINT fk_token_google_calendar_empresa  FOREIGN KEY (id_empresa)
                                                 REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_token_google_calendar_estado  CHECK (estado IN ('ACTIVO', 'REVOCADO')),
    CONSTRAINT uq_token_google_calendar_empresa  UNIQUE (id_empresa)
);

-- -----------------------------------------------------------------------------

-- evento_calendar: ID externo del evento en Google Calendar.
-- id_google_event guarda el ID que devuelve Google al crear el evento.
-- Sin este campo no se puede actualizar ni eliminar el evento cuando
-- cambia o se cancela la reserva.
-- UNIQUE (id_reserva): un evento de Calendar por reserva.
CREATE TABLE IF NOT EXISTS evento_calendar (
    id_evento_calendar  UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_reserva          UUID         NOT NULL,
    id_empresa          UUID         NOT NULL,
    id_google_event     STRING(200)  NOT NULL,
    estado              STRING(20)   NOT NULL DEFAULT 'PENDIENTE',
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ,

    CONSTRAINT pk_evento_calendar          PRIMARY KEY (id_evento_calendar),
    CONSTRAINT fk_evento_calendar_reserva  FOREIGN KEY (id_reserva)
                                           REFERENCES reserva(id_reserva)   ON DELETE RESTRICT,
    CONSTRAINT fk_evento_calendar_empresa  FOREIGN KEY (id_empresa)
                                           REFERENCES empresa(id_empresa)   ON DELETE RESTRICT,
    CONSTRAINT chk_evento_calendar_estado  CHECK (estado IN ('PENDIENTE', 'CREADO', 'ACTUALIZADO', 'ELIMINADO')),
    CONSTRAINT uq_evento_calendar_reserva  UNIQUE (id_reserva)
);
