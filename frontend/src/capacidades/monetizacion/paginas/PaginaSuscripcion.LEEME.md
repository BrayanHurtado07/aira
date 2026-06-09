# PaginaSuscripcion — Especificación UI/UX
> Ruta: `/monetizacion` · Rol: Admin

---

## Propósito

Gestión del plan SaaS de la barbería: activar, suspender y cancelar suscripciones.

---

## Layout: 2 pestañas

**Suscripciones activas** · **Activar plan**

---

## Pestaña 1: Suscripciones activas

### Tabla de suscripciones
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Plan | Nombre del plan | Ícono `Package` + "BASICO" / "PRO" / "ENTERPRISE" | `id_plan`, `id_suscripcion` |
| Estado | `estado` | `Insignia`: verde ACTIVA / amarillo SUSPENDIDA / rojo CANCELADA | Código |
| Inicio | `fecha_inicio` | `"23 Ene 2025"` | Fecha ISO |
| Renovación | `fecha_renovacion` | `"23 Ene 2026"` | Fecha ISO |
| Acciones | — | `MenuAcciones` | — |

### Acciones por estado

| Estado | Acciones |
|--------|---------|
| ACTIVA | Suspender, Cancelar |
| SUSPENDIDA | Cancelar |
| CANCELADA | (ninguna) |
| VENCIDA | (ninguna) |

### Confirmaciones
- **Suspender**: `DialogoConfirmacion` variante `advertencia`.
  - Texto: "La suscripción al plan [nombre] quedará suspendida temporalmente."
- **Cancelar definitivamente**: `DialogoConfirmacion` variante `peligro`.
  - Texto: "La suscripción al plan [nombre] se cancelará y no podrá reactivarse. El acceso a las funciones de ese plan se perderá."

---

## Pestaña 2: Activar plan

### Seleccionar plan
- Botones o tarjetas para cada plan disponible: BASICO, PRO, ENTERPRISE.
- Mostrar precio y beneficios clave de cada plan.
- Al seleccionar un plan, aparecen las fechas.

### Campos de activación
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Fecha de inicio | `SelectorFecha` | ✅ | Hoy o futura |
| Fecha de renovación | `SelectorFecha` | ✅ | `> fecha_inicio` |

### Preview
Antes de confirmar:
> "Plan [nombre] · vigente desde [fecha inicio] hasta [fecha renovación]"

- Botón "Activar plan" con `DialogoConfirmacion` variante `normal`.

---

## Estado vacío
- "No hay suscripciones activas."

---

## Reglas UX
- Los nombres de plan en MAYÚSCULAS son para el código. En la UI usar: "Plan Básico", "Plan Pro", "Plan Enterprise".
- Nunca mostrar `id_suscripcion` ni `id_plan` al usuario.
