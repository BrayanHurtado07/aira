# PaginaGestionBarberos — Especificación UI/UX
> Ruta: `/agenda/barberos` · Rol: Admin

---

## Propósito

Gestión completa del equipo de barberos: registro, edición de perfil, asignación de servicios, disponibilidad semanal y bloqueo de días.

## Layout

Diseño master-detail responsivo:
- **Panel izquierdo** (sidebar): lista de barberos con avatar, nombre y punto de estado.
- **Panel derecho** (detalle): perfil del barbero seleccionado con sus servicios, disponibilidad y excepciones.
- En **móvil**: paneles apilados verticalmente.

---

## Sección: Lista de barberos (panel izquierdo)

### Datos mostrados por barbero
| Dato | Cómo mostrarlo | Nunca mostrar |
|------|---------------|---------------|
| Nombre | Texto normal, mayúscula inicial | `id_barbero` |
| Avatar | Iniciales del nombre, 2 letras | UUID en alt text |
| Estado | Punto verde (ACTIVO) / gris (INACTIVO) | Texto "ACTIVO"/"INACTIVO" en la lista |

### Estado vacío
- Ícono: `Users`
- Mensaje: "Aún no tienes barberos en el equipo"
- Acción: botón "Registrar primer barbero"

---

## Sección: Registro de nuevo barbero

### Campos del formulario
| Campo | Tipo | Obligatorio | Validación | Placeholder |
|-------|------|-------------|-----------|-------------|
| Nombre completo | `Campo` | ✅ | `trim().length > 0` | "Ej: Juan Pérez" |
| Teléfono | `SelectorTelefono` | No | Mínimo 7 dígitos si se ingresa | "Ej: 987 654 321" |

### Comportamiento
- Modal tamaño `md`.
- Botón "Registrar" deshabilitado mientras envía (spinner + "Registrando…").
- Al éxito: toast verde "Barbero registrado", modal se cierra, barbero aparece en la lista.
- Al error 409: toast rojo "Ya existe un barbero con ese nombre".

---

## Sección: Perfil del barbero (detalle)

### Datos mostrados
| Dato | Cómo mostrarlo | Nunca mostrar |
|------|---------------|---------------|
| Nombre | Encabezado, editable inline | `id_barbero` |
| Teléfono | Fuente monoespaciada, ícono de teléfono | UUID |
| Estado | Selector ACTIVO / INACTIVO con confirmación si cambia a INACTIVO | Código de estado |
| Foto | Avatar con iniciales si no hay foto | URL interna |

### Edición de nombre y teléfono
- Click en el campo activa edición inline.
- Botón de guardar junto al campo.
- Validación: nombre no vacío.

### Cambio de estado
- ACTIVO → INACTIVO: `DialogoConfirmacion` variante `advertencia`.
- Texto: "Juan Pérez quedará inactivo y no podrá recibir reservas nuevas."

---

## Sección: Servicios del barbero

### Datos mostrados
- Lista de servicios asignados como chips con nombre y duración formateada.
- Duración: `"30 min"`, `"1 hr"`, `"1 hr 30 min"` — nunca en minutos crudos.

### Asignar / desasignar servicio
- Toggle por servicio (checkbox o interruptor).
- Sin modal de confirmación — acción inmediata con toast.
- Toast éxito: "Servicio asignado a [Nombre barbero]" / "Servicio desasignado".

---

## Sección: Disponibilidad semanal

### Datos mostrados
| Dato | Cómo mostrarlo |
|------|---------------|
| Día de la semana | "Lunes", "Martes", etc. — nunca número 0-6 |
| Horario | "09:00 – 18:00" — formato 24h con guión largo |
| Sede | Nombre de la sede |

### Agregar bloque de disponibilidad
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Sede | `Selector` | ✅ | Sede activa seleccionada |
| Día de la semana | `Selector` | ✅ | Opciones en español |
| Hora inicio | `input[type=time]` | ✅ | Formato HH:mm |
| Hora fin | `input[type=time]` | ✅ | Debe ser > hora inicio |

- Error si hora fin ≤ hora inicio: "La hora de fin debe ser posterior a la hora de inicio".

---

## Sección: Excepciones de disponibilidad

### Datos mostrados
| Dato | Cómo mostrarlo | Nunca mostrar |
|------|---------------|---------------|
| Fecha | "Lun 23 Ene 2025" | Fecha ISO cruda |
| Motivo | "Feriado", "Vacación", "Cierre", "Otro" — en español | Código interno |
| Descripción | Texto corto si existe | `id_excepcion` |

### Agregar excepción
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Fecha | `SelectorFecha` | ✅ | No pasada |
| Motivo | `Selector` | ✅ | FERIADO, VACACION, CIERRE, OTRO (en español en UI) |
| Descripción | `Campo` | No | Máx 200 caracteres |

### Eliminar excepción
- `DialogoConfirmacion` variante `advertencia`.
- Texto: "Se eliminará el bloqueo del [fecha]. El barbero volvería a estar disponible ese día."
