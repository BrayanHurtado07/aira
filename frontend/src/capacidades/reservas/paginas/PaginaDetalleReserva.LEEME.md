# PaginaDetalleReserva — Especificación UI/UX
> Ruta: `/reservas/:id` · Rol: Admin + Barbero

---

## Propósito

Vista detallada de una reserva con toda la información del cliente, barbero, servicios y complementos. Permite realizar transiciones de estado desde aquí.

---

## Encabezado de la página

- Título: `"Reserva — [Nombre Cliente]"` — nunca `"Reserva #UUID"`.
- Subtítulo: fecha y hora formateadas `"Martes 23 de enero · 14:30"`.
- Insignia de estado prominente.

---

## Sección: Información de la reserva

| Dato | Cómo mostrar | Nunca mostrar |
|------|-------------|---------------|
| Cliente | Avatar + nombre completo + teléfono en mono | `id_cliente`, `id_reserva` |
| Barbero | Nombre completo | `id_barbero` |
| Sede | Nombre de la sede | `id_sucursal` |
| Período | Nombre del período | `id_periodo` |
| Origen | Chip con ícono (WhatsApp / Presencial / Web) | Código interno |
| Fecha y hora | `"Martes 23 de enero de 2025 a las 14:30"` | Timestamp ISO |
| Duración | Suma de duración de servicios en formato legible | Minutos crudos |

---

## Sección: Servicios de la reserva

- Lista de servicios con nombre + duración + precio acordado.
- Si hay múltiples servicios, mostrar subtotal al final.
- Precio: `"S/ 45.00"`.

---

## Sección: Complementos

- Lista de productos complementarios con nombre + cantidad.
- Si no hay complementos: texto gris "Sin complementos".
- Nunca mostrar `id_producto`.

### Agregar complemento
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Producto | `Selector` de productos ACTIVOS | ✅ | — |
| Cantidad | `CampoNumerico` | ✅ | `> 0`, entero |

---

## Acciones disponibles

Visibles según el estado de la reserva:

| Estado | Acciones |
|--------|---------|
| PENDIENTE | Confirmar, Editar, Cancelar |
| CONFIRMADA | Completar, Marcar no asistió, Cancelar |
| COMPLETADA | (ninguna) |
| CANCELADA | (ninguna) |
| NO_ASISTIO | (ninguna) |

### Confirmaciones requeridas
- **Cancelar**: `DialogoConfirmacion` variante `peligro`.
  - Texto: "La reserva de [Nombre] del [fecha] quedará cancelada."
- **Completar**: directo, sin confirmación. Toast verde "Reserva completada".
- **Marcar no asistió**: `DialogoConfirmacion` variante `advertencia`.
  - Texto: "Se registrará que [Nombre] no asistió a su reserva del [fecha]."
- **Confirmar**: directo. Toast verde "Reserva confirmada".

---

## Reglas UX
- El título de la página y el breadcrumb usan el nombre del cliente, no el UUID.
- Al completar una reserva, sugerir acumular sello si el cliente tiene tarjeta de lealtad.
