-- =============================================================================
-- AIRA — Capacidad: Identidad
-- Tablas: usuario · sesion_global · verificacion_correo_electronico
-- Orden de ejecución: 01 / 15
-- Dependencias externas: ninguna (primer archivo)
-- Motor: CockroachDB
-- =============================================================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario          UUID         NOT NULL DEFAULT gen_random_uuid(),
    correo_electronico  STRING(100)  NOT NULL,
    contrasena_hash     STRING(200)  NOT NULL,
    nombre              STRING(100)  NOT NULL,
    telefono            STRING(20),
    correo_verificado   BOOL         NOT NULL DEFAULT false,
    estado              STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ,

    CONSTRAINT pk_usuario          PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_correo   UNIQUE (correo_electronico),
    CONSTRAINT chk_usuario_estado  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO', 'BLOQUEADO'))
);

CREATE INDEX idx_usuario_estado ON usuario (estado);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sesion_global (
    id_sesion_global    UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_usuario          UUID         NOT NULL,
    token_hash          STRING(200)  NOT NULL,
    refresh_token_hash  STRING(200),
    ip_origen           STRING(45),
    user_agent          STRING(300),
    expira_en           TIMESTAMPTZ  NOT NULL,
    estado              STRING(20)   NOT NULL DEFAULT 'ACTIVA',
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_sesion_global          PRIMARY KEY (id_sesion_global),
    CONSTRAINT fk_sesion_global_usuario  FOREIGN KEY (id_usuario)
                                         REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT uq_sesion_token_hash      UNIQUE (token_hash),
    CONSTRAINT chk_sesion_estado         CHECK (estado IN ('ACTIVA', 'EXPIRADA', 'REVOCADA'))
);

CREATE INDEX idx_sesion_usuario ON sesion_global (id_usuario, estado);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS verificacion_correo_electronico (
    id_verificacion  UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_usuario       UUID         NOT NULL,
    codigo_hash      STRING(200)  NOT NULL,
    expira_en        TIMESTAMPTZ  NOT NULL,
    usado            BOOL         NOT NULL DEFAULT false,
    creado_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_verificacion_correo          PRIMARY KEY (id_verificacion),
    CONSTRAINT fk_verificacion_correo_usuario  FOREIGN KEY (id_usuario)
                                               REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

CREATE INDEX idx_verificacion_usuario ON verificacion_correo_electronico (id_usuario, usado);
