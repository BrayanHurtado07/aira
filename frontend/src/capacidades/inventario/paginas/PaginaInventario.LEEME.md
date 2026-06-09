# PaginaInventario — Especificación UI/UX
> Ruta: `/inventario` · Rol: Admin

---

## Propósito

Gestión del catálogo de productos, niveles de stock por sede y registro de movimientos de entrada/salida.

---

## Layout: 3 pestañas

`Pestanas` con: **Productos** · **Stock** · **Movimientos**

---

## Pestaña 1: Productos

### Tabla de productos
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Nombre | `nombre` | Texto normal | `id_producto` |
| Código | `codigo` | Fuente monoespaciada, gris | UUID |
| Tipo | `tipo` | `Insignia` info: "Insumo barbero" / "Consumible cliente" | Código ENUM |
| Precio | `precio_unitario` | `"S/ 12.50"` | Número sin símbolo |
| Estado | `estado` | `Insignia` | Código interno |
| Acciones | — | `MenuAcciones` | — |

### Crear nuevo producto
| Campo | Tipo | Obligatorio | Validación | Placeholder |
|-------|------|-------------|-----------|-------------|
| Nombre | `Campo` | ✅ | `trim().length > 0` | "Ej: Cera para cabello" |
| Código | `Campo` | ✅ | Alfanumérico, único por empresa | "Ej: PROD-001" |
| Tipo | `Selector` | ✅ | INSUMO_BARBERO / CONSUMIBLE_CLIENTE | — |
| Precio unitario | `CampoMoneda` | ✅ | `>= 0` | "0.00" |
| Descripción | `Campo` | No | Máx 300 caracteres | — |

- Error 409: "Ya existe un producto con ese código."

### Estado vacío
- Ícono: `Package`
- Mensaje: "No hay productos registrados"

---

## Pestaña 2: Stock

### Selector de sede
- `Selector` con sedes activas de la empresa.
- Obligatorio para ver el stock — sin sede seleccionada: "Selecciona una sede para ver el stock."

### Tabla de stock
| Columna | Dato | Formato | Alerta visual |
|---------|------|---------|---------------|
| Producto | Nombre + código en mono | Texto | — |
| Stock actual | `cantidad_actual` | Número entero | Si `<= cantidad_minima`: `Insignia` advertencia "Bajo mínimo" + texto en rojo |
| Mínimo | `cantidad_minima` | Número entero en gris | — |

### Estado vacío
- Si no hay productos con stock: "Esta sede aún no tiene stock registrado."

---

## Pestaña 3: Movimientos (Registrar)

### Formulario de movimiento
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Producto | `Selector` de productos ACTIVOS | ✅ | — |
| Sede | `Selector` de sedes activas | ✅ | — |
| Tipo de movimiento | `Selector` | ✅ | Ver tabla abajo |
| Cantidad | `CampoNumerico` | ✅ | `!= 0`, puede ser decimal para insumos |
| Descripción | `Campo` | No | Contexto del movimiento |

### Tipos de movimiento (en UI)
| Código | Etiqueta visible |
|--------|-----------------|
| COMPRA | Compra / Ingreso |
| CONSUMO_SERVICIO | Consumo en servicio |
| CONSUMO_COMPLEMENTO | Consumo como complemento |
| AJUSTE | Ajuste de inventario |
| DEVOLUCION | Devolución |

- Al éxito: toast verde "Movimiento registrado."

---

## Reglas UX

- El código del producto siempre en fuente monoespaciada.
- Stock en rojo cuando está por debajo del mínimo — con insignia "Bajo mínimo".
- Cantidades negativas en movimientos de tipo CONSUMO muestran `"-5"` en rojo en el historial.
