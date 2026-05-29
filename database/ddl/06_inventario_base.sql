-- =============================================================================
-- AIRA — Capacidad: Inventario (tablas base)
-- Tablas: producto · stock_sucursal · consumo_servicio
-- Orden de ejecución: 06 / 15
-- Dependencias externas: empresa (02) · sucursal (02) · servicio (05)
-- Motor: CockroachDB
-- Nota: movimiento_inventario va en 14_inventario_movimientos.sql porque
--       depende de reserva (09). Las tablas base van aquí porque complemento_reserva
--       (en 09_reservas.sql) necesita id_producto.
-- =============================================================================

CREATE TABLE IF NOT EXISTS producto (
    id_producto     UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_empresa      UUID          NOT NULL,
    nombre          STRING(100)   NOT NULL,
    codigo          STRING(50)    NOT NULL,
    tipo            STRING(25)    NOT NULL,
    precio_unitario DECIMAL(15,2) NOT NULL DEFAULT 0,
    descripcion     STRING,
    estado          STRING(20)    NOT NULL DEFAULT 'ACTIVO',
    creado_en       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    creado_por      UUID,
    actualizado_en  TIMESTAMPTZ,
    actualizado_por UUID,

    CONSTRAINT pk_producto          PRIMARY KEY (id_producto),
    CONSTRAINT fk_producto_empresa  FOREIGN KEY (id_empresa)
                                    REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_producto_tipo    CHECK (tipo IN ('INSUMO_BARBERO', 'CONSUMIBLE_CLIENTE')),
    CONSTRAINT chk_producto_estado  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'ELIMINADO')),
    CONSTRAINT chk_producto_precio  CHECK (precio_unitario >= 0),
    CONSTRAINT uq_producto_codigo   UNIQUE (id_empresa, codigo)
);

CREATE INDEX idx_producto_empresa_tipo ON producto (id_empresa, tipo, estado);

-- -----------------------------------------------------------------------------

-- stock_sucursal: cantidad actual por producto por sucursal.
-- cantidad_actual es denormalización de performance documentada: se actualiza
-- atómicamente con cada movimiento_inventario. Calcular desde movimientos
-- en cada consulta sería inviable en operación.
CREATE TABLE IF NOT EXISTS stock_sucursal (
    id_stock         UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_producto      UUID          NOT NULL,
    id_sucursal      UUID          NOT NULL,
    cantidad_actual  DECIMAL(10,3) NOT NULL DEFAULT 0,
    cantidad_minima  DECIMAL(10,3) NOT NULL DEFAULT 0,
    actualizado_en   TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_stock_sucursal           PRIMARY KEY (id_stock),
    CONSTRAINT fk_stock_producto           FOREIGN KEY (id_producto)
                                           REFERENCES producto(id_producto)   ON DELETE RESTRICT,
    CONSTRAINT fk_stock_sucursal           FOREIGN KEY (id_sucursal)
                                           REFERENCES sucursal(id_sucursal)   ON DELETE RESTRICT,
    CONSTRAINT chk_stock_cantidad_actual   CHECK (cantidad_actual >= 0),
    CONSTRAINT chk_stock_cantidad_minima   CHECK (cantidad_minima >= 0),
    CONSTRAINT uq_stock_producto_sucursal  UNIQUE (id_producto, id_sucursal)
);

CREATE INDEX idx_stock_sucursal ON stock_sucursal (id_sucursal);

-- -----------------------------------------------------------------------------

-- consumo_servicio: cuánto producto consume cada servicio (estimado).
-- Usado por el bot para descontar stock automáticamente al completar una reserva.
CREATE TABLE IF NOT EXISTS consumo_servicio (
    id_servicio        UUID          NOT NULL,
    id_producto        UUID          NOT NULL,
    cantidad_estimada  DECIMAL(10,3) NOT NULL,

    CONSTRAINT pk_consumo_servicio           PRIMARY KEY (id_servicio, id_producto),
    CONSTRAINT fk_consumo_servicio_servicio  FOREIGN KEY (id_servicio)
                                             REFERENCES servicio(id_servicio)  ON DELETE RESTRICT,
    CONSTRAINT fk_consumo_servicio_producto  FOREIGN KEY (id_producto)
                                             REFERENCES producto(id_producto)  ON DELETE RESTRICT,
    CONSTRAINT chk_consumo_cantidad          CHECK (cantidad_estimada > 0)
);
