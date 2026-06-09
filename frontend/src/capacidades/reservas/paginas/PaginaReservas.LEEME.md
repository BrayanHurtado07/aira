# PaginaReservas — Especificación UI/UX
> Ruta: `/reservas` · Rol: Admin + Barbero

---

## Propósito

Vista principal del módulo de reservas. Muestra el listado con filtros por estado y acciones de transición.

---

## Chips resumen (encabezado)

Muestra contadores de reservas por estado. Visibles siempre, aunque el conteo sea 0.

| Chip | Estado | Color |
|------|--------|-------|
| Total | — | Primario |
| Pendientes | PENDIENTE | Advertencia |
| Confirmadas | CONFIRMADA | Éxito |
| Completadas | COMPLETADA | Info |
| Canceladas | CANCELADA | Neutral |

---

## Tabla de reservas

### Columnas
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Cliente | Nombre + teléfono | Avatar con iniciales + nombre en negrita + teléfono en mono gris | `id_cliente`, `id_reserva` |
| Barbero | Nombre | Texto monoespaciado | `id_barbero` |
| Fecha | `fecha_hora_inicio` | `"23 Ene · 14:30"` | Timestamp ISO |
| Origen | `origen` | Chip: WhatsApp (verde), Presencial (azul), Web (gris) | Código interno |
| Estado | `estado` | `Insignia` según estado | Código interno |
| Acciones | — | `MenuAcciones` | — |

### Acciones disponibles por estado

| Estado actual | Acciones disponibles |
|---------------|---------------------|
| PENDIENTE | Confirmar, Editar, Cancelar |
| CONFIRMADA | Completar, Cancelar |
| COMPLETADA | Ver detalle |
| CANCELADA | Ver detalle |
| NO_ASISTIO | Ver detalle |

### Confirmaciones requeridas
- **Cancelar reserva**: `DialogoConfirmacion` variante `peligro`.
  - Texto: "La reserva de [Nombre cliente] del [fecha] a las [hora] quedará cancelada."

### Estado vacío
- Ícono: `Calendar`
- Mensaje: "No hay reservas registradas"
- Acción: botón "Nueva reserva"

---

## Filtros

- Por estado (chips clicables arriba).
- Por fecha (rango: hoy, esta semana, este mes).
- Por barbero (selector, solo Admin).
- La URL no expone UUIDs en los filtros (usar nombres o slugs si es posible).

---

## Reglas UX

- El teléfono del cliente siempre en fuente monoespaciada.
- La hora se muestra en formato 24h: `"14:30"`, no `"2:30 PM"`.
- Las reservas más recientes van primero (orden descendente por fecha).
- En móvil: cada reserva se muestra como tarjeta con los datos más importantes.
