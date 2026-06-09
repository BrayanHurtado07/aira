# PaginaReservaPublica — Especificación UI/UX
> Ruta: `/reserva/:sucursalSlug` · Rol: Público (sin auth)
> ⚠️ Estado: Frontend completo. Backend CRÍTICO pendiente — faltan endpoints públicos `/api/publica/*`.

---

## Propósito

Wizard de 5 pasos para que clientes externos (sin cuenta) hagan una reserva en la barbería directamente desde su teléfono o computador.

---

## Indicador de pasos (`IndicadorPasos`)

Visible en todo momento en la parte superior. Muestra los 5 pasos con el paso actual resaltado.

```
① Servicio → ② Barbero y Fecha → ③ Datos del cliente → ④ Confirmación → ✅ Reservado
```

---

## Paso 1: Seleccionar servicio (`PasoServicio`)

### Datos mostrados
- Lista de servicios activos de la sede.
- Por cada servicio: nombre, duración formateada, precio.
- Selección visual (click en tarjeta, no dropdown).

### Reglas UX
- Nunca mostrar `id_servicio`.
- Si no hay servicios activos: "Esta barbería no tiene servicios disponibles en este momento."

---

## Paso 2: Seleccionar barbero y fecha (`PasoBarberoFecha`)

### Sub-paso 2a: Barbero
- Lista de barberos activos que ofrecen el servicio seleccionado.
- Opción "Cualquier barbero disponible" al inicio.
- Por cada barbero: foto/avatar + nombre.
- Nunca mostrar `id_barbero`.

### Sub-paso 2b: Fecha y hora
- Selector de fecha (calendario).
- Al seleccionar fecha, cargar slots disponibles del barbero/servicio.
- Slots mostrados como botones: `"09:00"`, `"09:30"`, etc.
- Slots no disponibles: deshabilitados y visualmente grises.
- Si no hay slots: "No hay horarios disponibles para esta fecha. Prueba con otro día."

---

## Paso 3: Datos del cliente (`PasoClienteDatos`)

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Nombre completo | `Campo` | ✅ | `trim().length > 0` |
| Teléfono | `SelectorTelefono` | ✅ | Mínimo 7 dígitos |
| Correo electrónico | `CampoEmail` | No | Formato email si se ingresa |

- Si el teléfono ya existe como cliente: prellenar nombre y correo con sus datos.
- El cliente no necesita crear una cuenta — el teléfono es su identidad.

---

## Paso 4: Confirmación (`PasoConfirmacion`)

Resumen de la reserva antes de confirmar:

| Dato | Formato |
|------|---------|
| Servicio | Nombre + duración |
| Barbero | Nombre (o "Cualquier barbero disponible") |
| Fecha y hora | `"Martes 23 de enero · 14:30"` |
| Precio | `"S/ 45.00"` |
| Cliente | Nombre + teléfono |

- Botón "Confirmar reserva".
- Botón "Editar" que vuelve al paso correspondiente.

---

## Paso 5: Reserva exitosa

- Mensaje de confirmación con ícono de check verde.
- Resumen de la reserva.
- Opción de agregar al calendario.
- **Nunca mostrar el ID de la reserva** — solo la información legible.

---

## Errores posibles

| Situación | Mensaje |
|-----------|---------|
| Slot ya tomado por otro usuario | "El horario seleccionado ya no está disponible. Por favor elige otro." + volver a paso 2 |
| Error de red | "No pudimos procesar tu reserva. Intenta de nuevo." |
| Sede no encontrada | "No encontramos esta barbería." |

---

## Reglas UX

- Esta página es pública — no requiere JWT ni sesión.
- Diseño simplificado, orientado a móvil (la mayoría de clientes reservarán desde WhatsApp).
- El progreso del wizard se puede navegar hacia atrás pero no saltar pasos.
- Sin sidebar ni navegación del panel admin — layout limpio.
- La URL nunca expone UUIDs al cliente: `/reserva/sede-principal`, no `/reserva/abc-123-xyz`.
