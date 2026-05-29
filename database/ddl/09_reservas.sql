-- =============================================================================
-- AIRA — Capacidad: Reservas
-- Tablas: cliente · reserva · reserva_servicio · complemento_reserva
--         lista_espera
-- Orden de ejecución: 09 / 15
-- Dependencias externas: empresa (02) · sucursal (02) · periodo (02)
--                        barbero (05) · servicio (05) · producto (06)
--                        conversacion (08)
-- Motor: CockroachDB
-- Nota: al final de este archivo se añade FK de conversacion → cliente
--       mediante ALTER TABLE (evita dependencia circular entre archivos 08 y 09)
-- =============================================================================

-- cliente: raíz multi-tenant.
-- UNIQUE (id_empresa, telefono): el teléfono es el identificador por WhatsApp.
-- El mismo número en dos empresas distintas = dos clientes aislados.
-- fecha_nacimiento nullable pero necesaria para campañas de cumpleaños.
CREATE TABLE IF NOT EXISTS cliente (
    id_cliente          UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_empresa          UUID         NOT NULL,
    nombre              STRING(100)  NOT NULL,
    telefono            STRING(20)   NOT NULL,
    correo_electronico  STRING(100),
    fecha_nacimiento    DATE,
    estado              STRING(20)   NOT NULL DEFAULT 'ACTIVO',
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por          UUID,
    actualizado_en      TIMESTAMPTZ,

    CONSTRAINT pk_cliente                  PRIMARY KEY (id_cliente),
    CONSTRAINT fk_cliente_empresa          FOREIGN KEY (id_empresa)
                                           REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT uq_cliente_empresa_telefono UNIQUE (id_empresa, telefono),
    CONSTRAINT chk_cliente_estado          CHECK (estado IN ('ACTIVO', 'BLOQUEADO', 'ELIMINADO'))
);

CREATE INDEX idx_cliente_empresa ON cliente (id_empresa, estado);

-- FK de conversacion → cliente (definida aquí porque cliente se crea en este archivo)
ALTER TABLE conversacion
    ADD CONSTRAINT fk_conversacion_cliente
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE RESTRICT;

-- -----------------------------------------------------------------------------

-- reserva: raíz del Core Domain.
-- fecha_hora_fin es snapshot (no derivado): se congela al crear la reserva
-- para consultas de disponibilidad sin recalcular desde los servicios.
CREATE TABLE IF NOT EXISTS reserva (
    id_reserva        UUID         NOT NULL DEFAULT gen_random_uuid(),
    id_empresa        UUID         NOT NULL,
    id_cliente        UUID         NOT NULL,
    id_barbero        UUID         NOT NULL,
    id_sucursal       UUID         NOT NULL,
    id_periodo        UUID         NOT NULL,
    fecha_hora_inicio TIMESTAMPTZ  NOT NULL,
    fecha_hora_fin    TIMESTAMPTZ  NOT NULL,
    estado            STRING(30)   NOT NULL DEFAULT 'PENDIENTE',
    origen            STRING(20)   NOT NULL DEFAULT 'WHATSAPP',
    creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    creado_por        UUID,
    actualizado_en    TIMESTAMPTZ,
    actualizado_por   UUID,

    CONSTRAINT pk_reserva             PRIMARY KEY (id_reserva),
    CONSTRAINT fk_reserva_empresa     FOREIGN KEY (id_empresa)
                                      REFERENCES empresa(id_empresa)   ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_cliente     FOREIGN KEY (id_cliente)
                                      REFERENCES cliente(id_cliente)   ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_barbero     FOREIGN KEY (id_barbero)
                                      REFERENCES barbero(id_barbero)   ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_sucursal    FOREIGN KEY (id_sucursal)
                                      REFERENCES sucursal(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_periodo     FOREIGN KEY (id_periodo)
                                      REFERENCES periodo(id_periodo)   ON DELETE RESTRICT,
    CONSTRAINT chk_reserva_estado     CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO')),
    CONSTRAINT chk_reserva_origen     CHECK (origen IN ('WHATSAPP', 'WEB', 'MANUAL')),
    CONSTRAINT chk_reserva_horario    CHECK (fecha_hora_fin > fecha_hora_inicio)
);

CREATE INDEX idx_reserva_empresa_estado ON reserva (id_empresa, estado);
CREATE INDEX idx_reserva_barbero_fecha  ON reserva (id_barbero, fecha_hora_inicio);
CREATE INDEX idx_reserva_sucursal_fecha ON reserva (id_sucursal, fecha_hora_inicio);
CREATE INDEX idx_reserva_cliente        ON reserva (id_cliente);

-- -----------------------------------------------------------------------------

-- reserva_servicio: qué servicios se acordaron y a qué precio.
-- precio_acordado es snapshot: si el dueño cambia el precio base mañana,
-- las reservas existentes no se ven afectadas.
CREATE TABLE IF NOT EXISTS reserva_servicio (
    id_reserva       UUID          NOT NULL,
    id_servicio      UUID          NOT NULL,
    precio_acordado  DECIMAL(15,2) NOT NULL,
    creado_en        TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_reserva_servicio           PRIMARY KEY (id_reserva, id_servicio),
    CONSTRAINT fk_reserva_servicio_reserva   FOREIGN KEY (id_reserva)
                                             REFERENCES reserva(id_reserva)   ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_servicio_servicio  FOREIGN KEY (id_servicio)
                                             REFERENCES servicio(id_servicio) ON DELETE RESTRICT,
    CONSTRAINT chk_reserva_servicio_precio   CHECK (precio_acordado >= 0)
);

-- -----------------------------------------------------------------------------

-- complemento_reserva: productos que el cliente pidió agregar a su visita
-- (ej. agua, cera, tratamiento especial). Genera movimiento de inventario.
CREATE TABLE IF NOT EXISTS complemento_reserva (
    id_reserva   UUID          NOT NULL,
    id_producto  UUID          NOT NULL,
    cantidad     DECIMAL(10,3) NOT NULL DEFAULT 1,

    CONSTRAINT pk_complemento_reserva            PRIMARY KEY (id_reserva, id_producto),
    CONSTRAINT fk_complemento_reserva_reserva    FOREIGN KEY (id_reserva)
                                                 REFERENCES reserva(id_reserva)   ON DELETE RESTRICT,
    CONSTRAINT fk_complemento_reserva_producto   FOREIGN KEY (id_producto)
                                                 REFERENCES producto(id_producto) ON DELETE RESTRICT,
    CONSTRAINT chk_complemento_cantidad          CHECK (cantidad > 0)
);

-- -----------------------------------------------------------------------------

-- lista_espera: cuando no hay disponibilidad, el cliente puede entrar en cola.
-- id_barbero nullable: el cliente puede querer cualquier barbero disponible.
CREATE TABLE IF NOT EXISTS lista_espera (
    id_lista_espera     UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_empresa          UUID        NOT NULL,
    id_cliente          UUID        NOT NULL,
    id_sucursal         UUID        NOT NULL,
    id_servicio         UUID        NOT NULL,
    id_barbero          UUID,
    fecha_hora_deseada  TIMESTAMPTZ NOT NULL,
    estado              STRING(30)  NOT NULL DEFAULT 'ESPERANDO',
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_lista_espera            PRIMARY KEY (id_lista_espera),
    CONSTRAINT fk_lista_espera_empresa    FOREIGN KEY (id_empresa)
                                          REFERENCES empresa(id_empresa)   ON DELETE RESTRICT,
    CONSTRAINT fk_lista_espera_cliente    FOREIGN KEY (id_cliente)
                                          REFERENCES cliente(id_cliente)   ON DELETE RESTRICT,
    CONSTRAINT fk_lista_espera_sucursal   FOREIGN KEY (id_sucursal)
                                          REFERENCES sucursal(id_sucursal) ON DELETE RESTRICT,
    CONSTRAINT fk_lista_espera_servicio   FOREIGN KEY (id_servicio)
                                          REFERENCES servicio(id_servicio) ON DELETE RESTRICT,
    CONSTRAINT fk_lista_espera_barbero    FOREIGN KEY (id_barbero)
                                          REFERENCES barbero(id_barbero)   ON DELETE RESTRICT,
    CONSTRAINT chk_lista_espera_estado    CHECK (estado IN ('ESPERANDO', 'NOTIFICADO', 'EXPIRADO', 'ATENDIDO'))
);

CREATE INDEX idx_lista_espera_empresa_estado ON lista_espera (id_empresa, estado);
