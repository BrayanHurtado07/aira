# PaginaNuevaReserva — Especificación UI/UX
> Ruta: `/reservas/nueva` · Rol: Admin + Barbero

---

## Propósito

Formulario de creación de reserva manual. Flujo guiado: seleccionar cliente → barbero → servicio → slot → confirmar.

---

## Flujo de pasos

1. **Seleccionar o registrar cliente** (buscador con opción de registrar nuevo)
2. **Seleccionar barbero** (solo ACTIVOS)
3. **Seleccionar servicio** (solo ACTIVOS, filtrado por barbero)
4. **Seleccionar slot** (`SelectorSlot`, carga disponibilidad real del backend)
5. **Canal de origen** (MANUAL, WHATSAPP, WEB)
6. Botón "Crear reserva"

---

## Sección: Buscar / Registrar cliente

### Buscador
- Campo de búsqueda por nombre, teléfono o correo.
- Resultados en dropdown con avatar + nombre + teléfono.
- Nunca mostrar `id_cliente` en los resultados.

### Registrar nuevo cliente (si no existe)
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Nombre completo | `Campo` | ✅ | `trim().length > 0` |
| Teléfono | `SelectorTelefono` | ✅ | Mínimo 7 dígitos |
| Correo electrónico | `CampoEmail` | No | Formato email si se ingresa |

- Error 409: "Ya existe un cliente con ese teléfono."

---

## Sección: Seleccionar barbero

- `Selector` con barberos ACTIVOS.
- Muestra: nombre del barbero.
- Al cambiar barbero, reinicia la selección de servicio y slot.

---

## Sección: Seleccionar servicio

- `Selector` con servicios asignados al barbero seleccionado, estado ACTIVO.
- Muestra: nombre + duración formateada + precio.
- Si el barbero no tiene servicios: mensaje "Este barbero no tiene servicios asignados."

---

## Sección: Seleccionar slot

- `SelectorSlot` que consulta `GET /api/agenda/slots` con los parámetros del barbero/servicio/fecha.
- Muestra slots en formato `"09:00"`, `"09:30"`, etc.
- Slots no disponibles aparecen deshabilitados.
- Si no hay slots: "No hay horarios disponibles para esta fecha. Prueba con otro día."

---

## Sección: Canal de origen

| Opción | Valor | Cuándo usar |
|--------|-------|-------------|
| Presencial | MANUAL | El cliente llegó en persona |
| WhatsApp | WHATSAPP | Se coordinó por WhatsApp |
| Web | WEB | El cliente reservó por la página |

---

## Confirmación y envío

- Botón "Crear reserva" deshabilitado hasta que todos los campos requeridos estén completos.
- Durante envío: spinner + "Creando reserva…".
- Al éxito: toast verde "Reserva creada" + redirigir a `/reservas`.
- Al error de conflicto: "El horario seleccionado ya no está disponible. Por favor elige otro."

---

## Reglas UX

- Los campos deben validarse en orden: no mostrar selector de servicio hasta que haya barbero.
- El selector de slot no carga hasta que haya barbero + servicio + fecha seleccionados.
- En móvil el formulario ocupa pantalla completa en una sola columna.
