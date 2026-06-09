# PaginaLealtad — Especificación UI/UX
> Ruta: `/lealtad` · Rol: Admin

---

## Propósito

Gestión completa del programa de lealtad: configuración, tarjetas de clientes, acumulación y canje de sellos.

---

## Layout: 3 pestañas

`Pestanas` con: **Resumen del programa** · **Acumular sello** · **Operaciones** (canje + anular)

---

## Pestaña 1: Resumen

### Card del programa activo

| Dato | Cómo mostrar | Nunca mostrar |
|------|-------------|---------------|
| Nombre del programa | Encabezado prominente | `id_programa` |
| Estado | `Insignia` verde "Activo" | Código |
| Sellos para recompensa | `"X sellos"` con ícono de estrella | Número crudo |
| Descripción de la recompensa | Texto descriptivo | — |
| Progreso visual | Círculos llenos/vacíos representando los sellos | IDs |

- Si no hay programa: `Vacio` + botón "Crear programa de lealtad".

### Tabla de tarjetas de clientes

| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Cliente | Nombre + teléfono | Avatar con iniciales + mono | `id_cliente`, `id_tarjeta` |
| Progreso | Círculos visuales | `X / Total` sellos | IDs |
| Sellos | `sellos_validos` | Número | `id_sello` |
| Canjes | `total_canjes` | Número | `id_canje` |

### Crear programa de lealtad (si no existe)
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Nombre | `Campo` | ✅ | `trim().length > 0` |
| Sellos para recompensa | `CampoNumerico` | ✅ | `>= 1` y `<= 50` |
| Descripción de la recompensa | `Campo` | ✅ | `trim().length > 0` |

---

## Pestaña 2: Acumular sello

1. Buscar cliente con `BuscadorCliente`.
2. Se muestra la tarjeta del cliente con sellos actuales.
3. Seleccionar reserva COMPLETADA del cliente.
4. Botón "Acumular sello".

### Lista de reservas completadas
- Muestra: fecha + hora + nombre del servicio.
- Nunca: `id_reserva`.
- Si ya tiene sello en esa reserva: la reserva aparece deshabilitada con texto "Sello ya acumulado."

- Al éxito: toast verde "Sello acumulado para [Nombre cliente]."

---

## Pestaña 3: Operaciones

### Sub-sección: Aplicar canje

1. Buscar cliente.
2. Se muestra tarjeta con sellos disponibles + visualización de círculos.
3. Ingresar sellos a usar (máx = sellos disponibles).
4. Ingresar descripción del beneficio aplicado.
5. Botón "Aplicar canje".

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Sellos a usar | `CampoNumerico` | ✅ | `>= 1`, `<= sellos_disponibles` |
| Descripción del beneficio | `Campo` | ✅ | Ej: "Corte gratuito" |

### Sub-sección: Anular sello

1. Buscar cliente.
2. Lista de sellos activos del cliente (mostrar: número de sello #1, #2... + fecha acumulado).
3. Seleccionar sello a anular.
4. Ingresar motivo.
5. `DialogoConfirmacion` variante `peligro`.

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| Sello | Selector de sellos activos | ✅ |
| Motivo de anulación | `Campo` | ✅ |

- En el selector, mostrar: `"Sello #1 — 23 Ene 2025"` — nunca `id_sello`.
- `DialogoConfirmacion`: "El sello #[número] de [Nombre cliente] del [fecha] quedará anulado."

---

## Reglas UX

- La visualización de sellos (círculos llenos/vacíos) hace inmediato entender el progreso.
- El número de sello (`#1`, `#2`) es el ordinal en la tarjeta, no el UUID.
- Si el cliente no tiene tarjeta todavía, indicar: "Este cliente aún no tiene tarjeta de lealtad. Se creará al acumular el primer sello."
