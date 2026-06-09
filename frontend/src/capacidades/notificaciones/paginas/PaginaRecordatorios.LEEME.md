# PaginaRecordatorios — Especificación UI/UX
> Ruta: `/notificaciones` · Rol: Admin

---

## Propósito

Programar recordatorios automáticos para que los clientes recuerden sus reservas.

---

## Chips de resumen

| Chip | Estado | Color |
|------|--------|-------|
| Pendientes | PENDIENTE | Advertencia |
| Enviados | ENVIADO | Éxito |
| Fallidos | FALLIDO | Error (solo visible si hay) |

---

## Tabla de recordatorios

### Columnas
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Cliente | Nombre + fecha de la reserva | Avatar + nombre + `"Reserva: 23 Ene · 14:30"` en gris | `id_cliente`, `id_recordatorio` |
| Enviar el | `enviar_en` | `"23 Ene 2025 · 09:00"` | Timestamp ISO |
| Canal | `canal` | Ícono + etiqueta: WhatsApp / Email | Código |
| Estado | `estado` | `Insignia` con ícono según estado | Código interno |
| Acciones | — | Cancelar (solo PENDIENTE) | — |

### Cancelar recordatorio
- `DialogoConfirmacion` variante `advertencia`.
- Texto: "El recordatorio para [Nombre cliente] programado para [fecha] quedará cancelado."

---

## Formulario: Programar recordatorio

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Cliente | `BuscadorCliente` | ✅ | — |
| Reserva | `Selector` (PENDIENTE + CONFIRMADA del cliente) | ✅ | Mostrar: fecha + hora + servicio |
| Enviar el | `SelectorFecha` con hora | ✅ | Fecha futura y antes de la reserva |
| Canal | Botones radio: WhatsApp / Email | ✅ | — |

### Preview automático
Cuando todos los campos están completos, mostrar:
> "Se enviará un recordatorio a [Nombre cliente] vía [WhatsApp/Email] el [fecha] a las [hora]."

- Al éxito: toast verde "Recordatorio programado."

---

## Estado vacío
- Ícono: `Bell`
- Mensaje: "No hay recordatorios programados"

---

## Reglas UX
- Los recordatorios pasados (ENVIADO/FALLIDO) pueden mostrarse en sección colapsada "Historial".
- En el selector de reserva, mostrar: `"23 Ene · 14:30 — Corte clásico con Juan"` — nunca `id_reserva`.
