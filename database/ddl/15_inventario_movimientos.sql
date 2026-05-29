-- =============================================================================
-- AIRA — Capacidad: Inventario (movimientos)
-- Tablas: movimiento_inventario
-- Orden de ejecución: 15 / 15
-- Dependencias externas: producto (06) · sucursal (02) · reserva (09)
-- Motor: CockroachDB
-- Nota: esta tabla se separa de 06_inventario_base.sql porque depende de
--       reserva (09). stock_sucursal y consumo_servicio van en el archivo 06.
-- =============================================================================

-- movimiento_inventario: registro de cada cambio de stock.
-- cantidad puede ser positiva (entrada: COMPRA, DEVOLUCION) o
-- negativa (salida: CONSUMO_SERVICIO, CONSUMO_COMPLEMENTO, AJUSTE negativo).
-- El stored proc actualiza stock_sucursal.cantidad_actual atómicamente.
-- id_reserva nullable: no todo movimiento viene de una reserva (compras, ajustes).
CREATE TABLE IF NOT EXISTS movimiento_inventario (
    id_movimiento      UUID          NOT NULL DEFAULT gen_random_uuid(),
    id_producto        UUID          NOT NULL,
    id_sucursal        UUID          NOT NULL,
    id_reserva         UUID,
    tipo_movimiento    STRING(30)    NOT NULL,
    cantidad           DECIMAL(10,3) NOT NULL,
    causa_descripcion  STRING(300),
    registrado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    registrado_por     UUID,

    CONSTRAINT pk_movimiento_inventario           PRIMARY KEY (id_movimiento),
    CONSTRAINT fk_movimiento_inventario_producto  FOREIGN KEY (id_producto)
                                                  REFERENCES producto(id_producto)   ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_inventario_sucursal  FOREIGN KEY (id_sucursal)
                                                  REFERENCES sucursal(id_sucursal)   ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_inventario_reserva   FOREIGN KEY (id_reserva)
                                                  REFERENCES reserva(id_reserva)     ON DELETE RESTRICT,
    CONSTRAINT chk_movimiento_tipo                CHECK (tipo_movimiento IN (
        'COMPRA', 'CONSUMO_SERVICIO', 'CONSUMO_COMPLEMENTO', 'AJUSTE', 'DEVOLUCION'
    )),
    CONSTRAINT chk_movimiento_cantidad_nozero     CHECK (cantidad != 0)
);

CREATE INDEX idx_movimiento_producto_sucursal ON movimiento_inventario (id_producto, id_sucursal, registrado_en DESC);
