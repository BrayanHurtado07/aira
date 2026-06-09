# PaginaGestionServicios — Especificación UI/UX
> Ruta: `/agenda/servicios` · Rol: Admin

---

## Propósito

Catálogo de servicios que ofrece la barbería: nombre, duración, precio base y estado.

---

## Tabla de servicios

### Columnas
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Nombre | Nombre del servicio | Texto normal | `id_servicio` |
| Duración | `duracion_minutos` | `"30 min"` / `"1 hr"` / `"1 hr 30 min"` | Minutos crudos |
| Precio | `precio_base` | `"S/ 45.00"` (siempre 2 decimales) | Número sin símbolo |
| Estado | `estado` | `Insignia` variante `exito` / `error` | Texto "ACTIVO" sin insignia |
| Acciones | — | `MenuAcciones` (editar, activar/desactivar) | — |

### Estado vacío
- Ícono: `Scissors`
- Mensaje: "No hay servicios registrados aún"

---

## Crear nuevo servicio

| Campo | Tipo | Obligatorio | Validación | Placeholder |
|-------|------|-------------|-----------|-------------|
| Nombre | `Campo` | ✅ | `trim().length > 0` | "Ej: Corte clásico" |
| Duración | `SelectorDuracion` | ✅ | `> 0` minutos | — |
| Precio | `CampoMoneda` | No | `>= 0` si se ingresa | "0.00" |
| Descripción | `Campo` | No | Máx 300 caracteres | "Describe el servicio..." |

- Modal tamaño `md`.
- Al éxito: toast verde "Servicio registrado".

---

## Editar servicio

- Mismos campos que creación, prellenados.
- Modal tamaño `md`.
- Al éxito: toast verde "Servicio actualizado".

---

## Cambiar estado

- ACTIVO → INACTIVO: `DialogoConfirmacion` variante `advertencia`.
- Texto: "El servicio '[nombre]' quedará inactivo y no podrá asignarse en nuevas reservas."
- INACTIVO → ACTIVO: directo, sin confirmación. Toast verde "Servicio activado".

---

## Reglas UX
- La duración se muestra **siempre en texto legible**, nunca como número de minutos.
- El precio `0.00` se muestra como `"S/ 0.00"`, no como vacío.
- Un servicio inactivo no debe aparecer en los selectores de barberos ni de reservas.
