# PaginaListaEspera — Especificación UI/UX
> Ruta: `/reservas/lista-espera` · Rol: Admin + Barbero
> ⚠️ Estado: UI completa. Backend pendiente (falta caso de uso + endpoint).

---

## Propósito

Gestión de clientes que quieren reservar pero no encontraron disponibilidad. Cuando se libera un slot, pueden ser notificados.

---

## Tabla de lista de espera

### Columnas
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Cliente | Nombre + teléfono | Avatar con iniciales + nombre + teléfono en mono | `id_cliente`, `id_lista_espera` |
| Servicio | Nombre del servicio | Texto + duración entre paréntesis | `id_servicio` |
| Fecha deseada | `fecha_hora_deseada` | `"23 Ene 2025 · 14:30"` | Timestamp ISO |
| Barbero | Nombre si hay preferencia, "Cualquiera" si no | Texto | `id_barbero` |
| Estado | `estado` | `Insignia` según estado | Código interno |
| Acciones | — | `MenuAcciones` | — |

### Mapa de estados
| Estado | Color | Significado |
|--------|-------|-------------|
| ESPERANDO | Advertencia (amarillo) | En cola, sin slot disponible |
| NOTIFICADO | Info (azul) | Se le notificó de un slot disponible |
| ATENDIDO | Éxito (verde) | Reserva realizada |
| EXPIRADO | Neutral (gris) | Fecha pasada sin reserva |

---

## Agregar a lista de espera

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Cliente | `BuscadorCliente` | ✅ | — |
| Sede | `Selector` | ✅ | Sede activa |
| Servicio | `Selector` | ✅ | Servicios activos |
| Barbero | `Selector` | No | "Cualquier barbero disponible" como opción |
| Fecha y hora deseada | `SelectorFecha` con hora | ✅ | Fecha futura |

- Al éxito: toast verde "Cliente agregado a la lista de espera."

---

## Estado vacío
- Ícono: `Clock`
- Mensaje: "No hay clientes en lista de espera"

---

## Reglas UX
- La lista de espera no garantiza una reserva — solo notificación.
- No mostrar UUIDs en ningún campo.
- Cuando el backend esté disponible, el botón "Notificar" aparecerá para entradas ESPERANDO.
