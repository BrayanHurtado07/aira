# Capacidad: Inventario
> Gestión de productos, stock por sede y movimientos de inventario.
> ⚠️ Estado: Frontend completo. Backend parcial (CrearProducto y RegistrarMovimiento implementados; faltan endpoints GET).

## Página

| Página | Ruta | Rol |
|--------|------|-----|
| `PaginaInventario` | `/inventario` | Admin |

## Reglas del dominio

- Un producto tiene un código único por empresa.
- El stock se lleva por producto + sede.
- Un movimiento registra entrada (COMPRA) o salida (CONSUMO, AJUSTE, DEVOLUCION).
- **Nunca mostrar** `id_producto`, `id_stock`, `id_movimiento`.
- El producto se identifica por **nombre + código**.

## Dependencias

- Depende de: `organizacion` (sedes para stock)
- Es consumida por: `reservas` (complementos de reserva consumen inventario)
