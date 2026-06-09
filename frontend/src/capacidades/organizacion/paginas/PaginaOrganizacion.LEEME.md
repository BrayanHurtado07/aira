# PaginaOrganizacion — Especificación UI/UX
> Ruta: `/organizacion` · Rol: Admin

---

## Propósito

Configuración de la estructura de la barbería: sedes físicas y períodos contables.

---

## Layout: 2 secciones o pestañas

**Sedes** · **Períodos**

---

## Sección: Sedes

### Tabla de sedes
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Sede | Nombre | Ícono `MapPin` + nombre | `id_sucursal` |
| Estado | `estado` | `Insignia` | Código |
| Acciones | — | Activar / Desactivar | — |

### Crear nueva sede
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Nombre de la sede | `Campo` | ✅ | `trim().length > 0` |

- Al éxito: toast verde "Sede registrada."
- Error 409: "Ya existe una sede con ese nombre."

### Cambiar estado
- ACTIVO → INACTIVO: `DialogoConfirmacion` variante `advertencia`.
  - Texto: "La sede '[nombre]' quedará inactiva. Los barberos y reservas de esta sede no se verán afectadas."
- INACTIVO → ACTIVO: directo, toast verde.

### Indicador
- Chip o badge: "X sedes activas" con ícono `Building2`.

---

## Sección: Períodos

### Tabla de períodos
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Nombre | `nombre` | Texto | `id_periodo` |
| Inicio | `fecha_inicio` | `"23 Ene 2025"` | Fecha ISO |
| Fin | `fecha_fin` | `"23 Feb 2025"` | Fecha ISO |
| Estado | `estado` | `Insignia` | Código |
| Acciones | — | Cerrar (si ACTIVO) | — |

### Crear período
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Nombre | `Campo` | ✅ | Ej: "Enero 2025" |
| Fecha inicio | `SelectorFecha` | ✅ | — |
| Fecha fin | `SelectorFecha` | ✅ | `> fecha_inicio` |

### Cerrar período
- `DialogoConfirmacion` variante `advertencia`.
- Texto: "El período '[nombre]' se cerrará. Las reservas asociadas quedarán fijadas."

---

## Estado vacío (por sección)
- Sedes: "No hay sedes registradas" / Acción: "Registrar primera sede"
- Períodos: "No hay períodos registrados" / Acción: "Crear primer período"

---

## Reglas UX
- Nunca mostrar `id_sucursal` ni `id_periodo` en ningún campo visible.
- El nombre de la sede es la identidad visual en todo el sistema — debe ser descriptivo ("Sede Principal", "Local Centro", etc.).
