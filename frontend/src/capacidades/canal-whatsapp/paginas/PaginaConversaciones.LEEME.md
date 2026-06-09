# PaginaConversaciones + PaginaDetalleConversacion — Especificación UI/UX
> Rutas: `/canal-whatsapp` y `/canal-whatsapp/:id` · Rol: Admin

---

## PaginaConversaciones (`/canal-whatsapp`)

### Propósito
Vista general de todas las conversaciones de WhatsApp activas con los clientes.

### Lista de conversaciones
| Dato | Formato | Nunca mostrar |
|------|---------|---------------|
| Número de teléfono del cliente | Fuente mono, con prefijo de país | `id_conversacion`, `id_cliente` |
| Estado | `Insignia`: ACTIVA / CERRADA / EXPIRADA | Código |
| Último mensaje | Texto truncado + hora | Contenido completo en la lista |
| Mensajes sin leer | Badge numérico | `id_mensaje` |

### Estado vacío
- Ícono: `MessageSquare`
- Mensaje: "No hay conversaciones activas"

---

## PaginaDetalleConversacion (`/canal-whatsapp/:id`)

### Encabezado
- Título: número de teléfono del cliente (formateado).
- Si el cliente está registrado, mostrar también su nombre.
- Nunca mostrar `id_conversacion`.

### Vista de mensajes
| Dato | Formato |
|------|---------|
| Mensaje de entrada (cliente) | Burbuja alineada a la izquierda |
| Mensaje de salida (bot/admin) | Burbuja alineada a la derecha |
| Hora del mensaje | `"14:30"` bajo la burbuja, gris |
| Tipo | TEXTO normal; IMAGEN con miniatura; AUDIO con reproductor |

- Nunca mostrar `id_mensaje`, `id_externo_wa`.
- La hora del mensaje en formato 24h.
- Separadores de fecha: `"Hoy"`, `"Ayer"`, `"23 Ene"`.

---

## Reglas UX
- El identificador de la conversación en la URL puede ser opaco — no es problema porque el usuario nunca lo ve ni lo copia.
- El número de teléfono del cliente es la identidad primaria en WhatsApp.
- Si el número no tiene cliente registrado, mostrar solo el número con opción "Registrar como cliente".
