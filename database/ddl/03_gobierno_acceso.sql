-- =============================================================================
-- AIRA — Capacidad: Gobierno de Acceso
-- Tablas: rol · permiso · rol_permiso · alcance · auditoria_accion
-- Orden de ejecución: 03 / 15
-- Dependencias externas: usuario (01) · empresa (02) · sucursal (02)
-- Motor: CockroachDB
-- =============================================================================

CREATE TABLE IF NOT EXISTS rol (
    id_rol       UUID        NOT NULL DEFAULT gen_random_uuid(),
    nombre       STRING(50)  NOT NULL,
    descripcion  STRING,
    estado       STRING(20)  NOT NULL DEFAULT 'ACTIVO',
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_rol         PRIMARY KEY (id_rol),
    CONSTRAINT uq_rol_nombre  UNIQUE (nombre),
    CONSTRAINT chk_rol_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS permiso (
    id_permiso   UUID         NOT NULL DEFAULT gen_random_uuid(),
    codigo       STRING(100)  NOT NULL,
    descripcion  STRING,
    capacidad    STRING(50)   NOT NULL,
    estado       STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_permiso         PRIMARY KEY (id_permiso),
    CONSTRAINT uq_permiso_codigo  UNIQUE (codigo),
    CONSTRAINT chk_permiso_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE INDEX idx_permiso_capacidad ON permiso (capacidad, estado);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rol_permiso (
    id_rol      UUID        NOT NULL,
    id_permiso  UUID        NOT NULL,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_rol_permiso          PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT fk_rol_permiso_rol      FOREIGN KEY (id_rol)
                                       REFERENCES rol(id_rol)         ON DELETE RESTRICT,
    CONSTRAINT fk_rol_permiso_permiso  FOREIGN KEY (id_permiso)
                                       REFERENCES permiso(id_permiso) ON DELETE RESTRICT
);

CREATE INDEX idx_rol_permiso_permiso ON rol_permiso (id_permiso);

-- -----------------------------------------------------------------------------

-- alcance: une usuario + empresa (+ sucursal opcional) + rol
-- id_sucursal nullable: NULL = acceso a toda la empresa (dueno_barberia)
--                       NOT NULL = acceso a sucursal específica (admin_sucursal, barbero)
CREATE TABLE IF NOT EXISTS alcance (
    id_alcance   UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_usuario   UUID        NOT NULL,
    id_empresa   UUID        NOT NULL,
    id_sucursal  UUID,
    id_rol       UUID        NOT NULL,
    estado       STRING(20)  NOT NULL DEFAULT 'ACTIVO',
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
    creado_por   UUID,

    CONSTRAINT pk_alcance          PRIMARY KEY (id_alcance),
    CONSTRAINT fk_alcance_usuario  FOREIGN KEY (id_usuario)
                                   REFERENCES usuario(id_usuario)   ON DELETE RESTRICT,
    CONSTRAINT fk_alcance_empresa  FOREIGN KEY (id_empresa)
                                   REFERENCES empresa(id_empresa)   ON DELETE RESTRICT,
    CONSTRAINT fk_alcance_sucursal FOREIGN KEY (id_sucursal)
                                   REFERENCES sucursal(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT fk_alcance_rol      FOREIGN KEY (id_rol)
                                   REFERENCES rol(id_rol)           ON DELETE RESTRICT,
    CONSTRAINT chk_alcance_estado  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO'))
);

CREATE INDEX idx_alcance_usuario_empresa ON alcance (id_usuario, id_empresa, estado);

-- -----------------------------------------------------------------------------

-- auditoria_accion: append-only, no actualizado_en ni actualizado_por
-- realizado_en en vez de creado_en para semántica correcta de auditoría
CREATE TABLE IF NOT EXISTS auditoria_accion (
    id_auditoria  UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_usuario    UUID,
    id_empresa    UUID        NOT NULL,
    entidad       STRING(50)  NOT NULL,
    entidad_id    UUID        NOT NULL,
    accion        STRING(30)  NOT NULL,
    detalle_json  JSONB,
    ip_origen     STRING(45),
    realizado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_auditoria_accion   PRIMARY KEY (id_auditoria),
    CONSTRAINT fk_auditoria_empresa  FOREIGN KEY (id_empresa)
                                     REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_auditoria_accion  CHECK (accion IN (
        'CREAR', 'ACTUALIZAR', 'ELIMINAR',
        'INICIAR_SESION', 'CERRAR_SESION',
        'APROBAR', 'RECHAZAR', 'ANULAR', 'CANCELAR'
    ))
);

CREATE INDEX idx_auditoria_empresa_entidad ON auditoria_accion (id_empresa, entidad, realizado_en DESC);
CREATE INDEX idx_auditoria_usuario         ON auditoria_accion (id_usuario, realizado_en DESC);
