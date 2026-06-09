# PaginaPlantillas — Especificación UI/UX
> Ruta: `/notificaciones/plantillas` · Rol: Admin
> ⚠️ Estado: UI completa. Backend pendiente (falta endpoint POST /api/plantillas-mensaje).

---

## Propósito

Gestión de plantillas de mensajes para WhatsApp y Email. Las plantillas usan variables dinámicas que se reemplazan al enviar.

---

## Tabla de plantillas

### Columnas
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Nombre | `nombre` | Texto | `id_plantilla` |
| Canal | `canal` | Ícono + etiqueta: "WhatsApp" / "Email" | Código |
| Contenido | `contenido_plantilla` | Truncado a ~80 chars con `"..."` | `id_empresa` |
| Estado | `estado` | `Insignia` | Código |
| Acciones | — | Ver completo, copiar | — |

---

## Crear plantilla

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Nombre | `Campo` | ✅ | `trim().length > 0` |
| Canal | `Selector` | ✅ | WHATSAPP / EMAIL |
| Contenido | `textarea` | ✅ | Soporta variables: `{nombre}`, `{fecha}`, `{hora}`, `{barbero}`, `{servicio}` |

### Variables disponibles
Mostrar como chips clicables debajo del textarea:
`{nombre}` · `{fecha}` · `{hora}` · `{barbero}` · `{servicio}` · `{sede}`

Al hacer click en un chip, se inserta la variable en el cursor del textarea.

---

## Ver contenido completo
- Modal tamaño `lg` que muestra el contenido completo sin truncar.
- Botón "Copiar" que copia al portapapeles.

---

## Reglas UX
- Las variables en el contenido se resaltan visualmente (texto primario).
- Preview del mensaje con variables reemplazadas por valores de ejemplo.
- Nunca mostrar `id_plantilla` ni `id_empresa`.
