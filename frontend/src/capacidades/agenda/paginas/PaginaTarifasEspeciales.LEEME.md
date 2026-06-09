# PaginaTarifasEspeciales — Especificación UI/UX
> Ruta: `/agenda/tarifas` · Rol: Admin
> ⚠️ Estado: UI existe. Backend pendiente (falta caso de uso + endpoint POST).

---

## Propósito

Precios diferenciados para servicios específicos en fechas puntuales (feriados, eventos especiales).

---

## Tabla de tarifas especiales

| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Servicio | Nombre del servicio | Texto | `id_servicio` |
| Fecha | `fecha` | `"Martes 23 Ene 2025"` | Fecha ISO |
| Precio especial | `precio_especial` | `"S/ 60.00"` | Número sin símbolo |
| Motivo | `motivo` | Texto | — |
| Acciones | — | Eliminar | — |

---

## Crear tarifa especial

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Servicio | `Selector` (ACTIVOS) | ✅ | — |
| Fecha | `SelectorFecha` | ✅ | No pasada |
| Precio especial | `CampoMoneda` | ✅ | `> 0` |
| Motivo | `Campo` | No | Descripción del motivo |

- Al éxito: toast verde "Tarifa especial registrada."

---

## Eliminar tarifa
- `DialogoConfirmacion` variante `advertencia`.
- Texto: "La tarifa especial del servicio '[nombre]' del [fecha] quedará eliminada. Se usará el precio base."

---

## Estado vacío
- Ícono: `Tag`
- Mensaje: "No hay tarifas especiales configuradas"

---

## Reglas UX
- Una tarifa especial sobreescribe el precio base únicamente en esa fecha y sede específica.
- Si existe una tarifa especial para una fecha, el `SelectorSlot` debe mostrarla al usuario en la reserva pública.
