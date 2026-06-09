# PaginaAgendaBarbero — Especificación UI/UX
> Ruta: `/agenda/disponibilidad` · Rol: Admin

---

## Propósito

Configurar los bloques de disponibilidad semanal de cada barbero por sede, y registrar excepciones (días bloqueados).

---

## Sección: Selector de barbero

- `Selector` con todos los barberos **ACTIVOS** de la empresa.
- Muestra: nombre del barbero.
- Al seleccionar, carga su disponibilidad y excepciones.
- Nunca mostrar `id_barbero` en el selector.

---

## Sección: Disponibilidad semanal

### Vista de bloques
| Dato | Formato |
|------|---------|
| Día | "Lunes", "Martes"… — nunca número 0-6 |
| Horario | `"09:00 – 18:00"` |
| Sede | Nombre de la sede |

- Los bloques se agrupan por día.
- Si un día no tiene bloque: se muestra vacío con texto gris "Sin disponibilidad".

### Agregar bloque
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Sede | `Selector` de sedes activas | ✅ | — |
| Día | `Selector` con días en español | ✅ | — |
| Hora inicio | `input[type=time]` | ✅ | Formato `HH:mm` |
| Hora fin | `input[type=time]` | ✅ | `> hora inicio` |

- Error inline si hora fin ≤ hora inicio.
- Al éxito: toast verde "Disponibilidad registrada".

---

## Sección: Excepciones (días bloqueados)

### Lista de excepciones
| Dato | Formato | Nunca mostrar |
|------|---------|---------------|
| Fecha | `"Lun 23 Ene 2025"` | Fecha ISO cruda |
| Motivo | Texto legible: "Feriado nacional", "Vacaciones", "Cierre temporal", "Otro" | Código ENUM |
| Descripción | Texto si existe | `id_excepcion` |

### Agregar excepción
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| Fecha | `SelectorFecha` | ✅ |
| Motivo | `Selector` (texto en español) | ✅ |
| Descripción | `Campo` opcional | No |

- Al éxito: toast verde "Día bloqueado".

### Eliminar excepción
- `DialogoConfirmacion` variante `advertencia`.
- Texto: "El bloqueo del [fecha] se eliminará y el barbero volvería a estar disponible."
- Al éxito: toast "Bloqueo eliminado".

---

## Reglas UX
- Si no hay barbero seleccionado, mostrar estado vacío general: "Selecciona un barbero para ver su disponibilidad."
- Las excepciones futuras se muestran primero (ordenadas por fecha ascendente).
- Las excepciones pasadas pueden mostrarse en sección colapsada "Historial".
