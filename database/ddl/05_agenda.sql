-- =============================================================================
-- AIRA — Capacidad: Agenda
-- Tablas: barbero · servicio · barbero_servicio · disponibilidad
--         excepcion_disponibilidad · tarifa_especial
-- Orden de ejecución: 05 / 15
-- Dependencias externas: usuario (01) · empresa (02) · sucursal (02)
-- Motor: CockroachDB
-- =============================================================================

-- barbero.id_usuario es nullable: el dueño puede crear el perfil del barbero
-- antes de que el barbero cree su cuenta en la plataforma.
CREATE TABLE IF NOT EXISTS barbero (
    id_barbero      UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_empresa      UUID         NOT NULL,
    id_usuario      UUID,
    nombre          STRING(100)  NOT NULL,
    telefono        STRING(20),
    foto_url        STRING(300),
    estado          STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por      UUID,
    actualizado_en  TIMESTAMPTZ,
    actualizado_por UUID,

    CONSTRAINT pk_barbero         PRIMARY KEY (id_barbero),
    CONSTRAINT fk_barbero_empresa FOREIGN KEY (id_empresa)
                                  REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT fk_barbero_usuario FOREIGN KEY (id_usuario)
                                  REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT chk_barbero_estado CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO'))
);

CREATE INDEX idx_barbero_empresa ON barbero (id_empresa, estado);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS servicio (
    id_servicio       UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_empresa        UUID          NOT NULL,
    nombre            STRING(100)   NOT NULL,
    duracion_minutos  INT2          NOT NULL,
    precio_base       DECIMAL(15,2) NOT NULL,
    descripcion       STRING,
    estado            STRING(20)    NOT NULL DEFAULT 'ACTIVO',
    creado_en         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    actualizado_en    TIMESTAMPTZ,
    actualizado_por   UUID,

    CONSTRAINT pk_servicio           PRIMARY KEY (id_servicio),
    CONSTRAINT fk_servicio_empresa   FOREIGN KEY (id_empresa)
                                     REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_servicio_estado   CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO')),
    CONSTRAINT chk_servicio_duracion CHECK (duracion_minutos > 0),
    CONSTRAINT chk_servicio_precio   CHECK (precio_base >= 0)
);

CREATE INDEX idx_servicio_empresa ON servicio (id_empresa, estado);

-- -----------------------------------------------------------------------------

-- barbero_servicio: qué servicios puede realizar cada barbero.
-- El bot consulta esta tabla para ofrecer opciones válidas al cliente.
CREATE TABLE IF NOT EXISTS barbero_servicio (
    id_barbero  UUID NOT NULL,
    id_servicio UUID NOT NULL,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_barbero_servicio           PRIMARY KEY (id_barbero, id_servicio),
    CONSTRAINT fk_barbero_servicio_barbero   FOREIGN KEY (id_barbero)
                                             REFERENCES barbero(id_barbero)   ON DELETE RESTRICT,
    CONSTRAINT fk_barbero_servicio_servicio  FOREIGN KEY (id_servicio)
                                             REFERENCES servicio(id_servicio) ON DELETE RESTRICT
);

CREATE INDEX idx_barbero_servicio_servicio ON barbero_servicio (id_servicio);

-- -----------------------------------------------------------------------------

-- disponibilidad: bloques horarios recurrentes por día de la semana.
-- SIN UNIQUE (id_barbero, id_sucursal, dia_semana): permite turno partido
-- (ej. 9-13 y 15-19 el mismo lunes). Validación de solapamiento = stored proc.
CREATE TABLE IF NOT EXISTS disponibilidad (
    id_disponibilidad  UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_barbero         UUID        NOT NULL,
    id_sucursal        UUID        NOT NULL,
    dia_semana         INT2        NOT NULL,
    hora_inicio        TIME        NOT NULL,
    hora_fin           TIME        NOT NULL,
    estado             STRING(20)  NOT NULL DEFAULT 'ACTIVO',
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    creado_por         UUID,
    actualizado_en     TIMESTAMPTZ,

    CONSTRAINT pk_disponibilidad           PRIMARY KEY (id_disponibilidad),
    CONSTRAINT fk_disponibilidad_barbero   FOREIGN KEY (id_barbero)
                                           REFERENCES barbero(id_barbero)   ON DELETE RESTRICT,
    CONSTRAINT fk_disponibilidad_sucursal  FOREIGN KEY (id_sucursal)
                                           REFERENCES sucursal(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT chk_disponibilidad_dia      CHECK (dia_semana BETWEEN 0 AND 6),
    CONSTRAINT chk_disponibilidad_horario  CHECK (hora_fin > hora_inicio),
    CONSTRAINT chk_disponibilidad_estado   CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO'))
);

CREATE INDEX idx_disponibilidad_barbero_sucursal ON disponibilidad (id_barbero, id_sucursal, dia_semana);

-- -----------------------------------------------------------------------------

-- excepcion_disponibilidad: bloqueo de un día completo para un barbero.
-- FK a id_barbero + id_sucursal (no a id_disponibilidad) porque la excepción
-- aplica a TODOS los turnos del día, incluido turno partido.
-- UNIQUE (id_barbero, id_sucursal, fecha): un solo bloqueo por día.
CREATE TABLE IF NOT EXISTS excepcion_disponibilidad (
    id_excepcion  UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_barbero    UUID         NOT NULL,
    id_sucursal   UUID         NOT NULL,
    fecha         DATE         NOT NULL,
    motivo        STRING(30)   NOT NULL,
    descripcion   STRING(200),
    creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por    UUID,

    CONSTRAINT pk_excepcion_disponibilidad             PRIMARY KEY (id_excepcion),
    CONSTRAINT fk_excepcion_disponibilidad_barbero     FOREIGN KEY (id_barbero)
                                                       REFERENCES barbero(id_barbero)   ON DELETE RESTRICT,
    CONSTRAINT fk_excepcion_disponibilidad_sucursal    FOREIGN KEY (id_sucursal)
                                                       REFERENCES sucursal(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT chk_excepcion_motivo                    CHECK (motivo IN ('FERIADO', 'VACACION', 'CIERRE', 'OTRO')),
    CONSTRAINT uq_excepcion_barbero_sucursal_fecha     UNIQUE (id_barbero, id_sucursal, fecha)
);

-- -----------------------------------------------------------------------------

-- tarifa_especial: precio diferencial por día (ej. feriados más caros).
-- UNIQUE (id_sucursal, id_servicio, fecha): un solo precio especial por combinación.
CREATE TABLE IF NOT EXISTS tarifa_especial (
    id_tarifa       UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_sucursal     UUID          NOT NULL,
    id_servicio     UUID          NOT NULL,
    fecha           DATE          NOT NULL,
    precio_especial DECIMAL(15,2) NOT NULL,
    motivo          STRING(200),
    creado_en       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    creado_por      UUID,

    CONSTRAINT pk_tarifa_especial                 PRIMARY KEY (id_tarifa),
    CONSTRAINT fk_tarifa_especial_sucursal        FOREIGN KEY (id_sucursal)
                                                  REFERENCES sucursal(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT fk_tarifa_especial_servicio        FOREIGN KEY (id_servicio)
                                                  REFERENCES servicio(id_servicio) ON DELETE RESTRICT,
    CONSTRAINT chk_tarifa_especial_precio         CHECK (precio_especial >= 0),
    CONSTRAINT uq_tarifa_sucursal_servicio_fecha  UNIQUE (id_sucursal, id_servicio, fecha)
);
