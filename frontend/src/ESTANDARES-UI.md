# ESTANDARES UI/UX — AIRA Frontend
> Documento maestro. Toda página, componente y sección del frontend debe respetar estas reglas.
> Actualizado: 2026-06-09

---

## 1. REGLA DE ORO — Nunca mostrar UUIDs al usuario

Los UUIDs son identificadores internos. El usuario **nunca** debe verlos en pantalla.

### ¿Cómo reemplazar un UUID?

| Contexto | En lugar de UUID mostrar |
|----------|--------------------------|
| Cliente | Nombre completo + teléfono |
| Barbero | Nombre completo |
| Reserva | Nombre cliente + fecha + hora |
| Servicio | Nombre del servicio |
| Sede | Nombre de la sede |
| Plan | Nombre del plan (BASICO, PRO, ENTERPRISE) |
| Período | Nombre del período + rango de fechas |
| Empresa | Nombre de la empresa |
| Conversación WhatsApp | Número de teléfono del cliente |

### Reglas específicas

- En URLs: usar identificadores legibles si es posible (ej: `/reserva/sede-principal`). Si se usa ID en URL, no mostrarlo en el `<title>` ni en encabezados.
- En tablas: nunca una columna "ID" o "UUID".
- En mensajes de error: nunca exponer el ID del recurso fallido.
- En `console.log` de producción: nunca.
- En formularios: los campos de selección usan el nombre/etiqueta del recurso, no su ID. El ID se guarda en estado interno, nunca en el `value` visible.

---

## 2. Sistema de colores

Todos los colores vienen de CSS variables definidas en el tema. **Nunca hardcodear colores hexadecimales en componentes.**

### Variables de color principales

```css
/* Primarios */
--color-primario         /* Acción principal, CTA */
--color-primario-claro   /* Hover de primario */
--color-primario-fondo   /* Fondo sutil de primario */

/* Superficie */
--color-fondo            /* Fondo general de la app */
--color-superficie        /* Cards, modales, sidebars */
--color-borde            /* Líneas separadoras */
--color-borde-suave      /* Bordes muy sutiles */

/* Texto */
--color-texto            /* Texto principal */
--color-texto-secundario /* Texto de apoyo, metadatos */
--color-texto-deshabilitado /* Campos deshabilitados */

/* Semánticos */
--color-exito            /* Confirmaciones, ACTIVO, COMPLETADA */
--color-exito-fondo
--color-advertencia      /* Pendiente, suspendido, bajo mínimo */
--color-advertencia-fondo
--color-error            /* Errores, CANCELADO, ANULADO */
--color-error-fondo
--color-info             /* Información neutral */
--color-info-fondo
```

### Mapeo de estados a colores

| Estado de negocio | Color semántico | Componente |
|-------------------|-----------------|-----------|
| ACTIVO / CONFIRMADA / COMPLETADA / ENVIADO | `exito` | `Insignia` variante `exito` |
| PENDIENTE / ESPERANDO / SUSPENDIDA | `advertencia` | `Insignia` variante `advertencia` |
| CANCELADA / INACTIVO / FALLIDO / ANULADO | `error` | `Insignia` variante `error` |
| EN_PROCESO / NOTIFICADO / CALCULADA | `info` | `Insignia` variante `info` |
| ELIMINADO / NO_ASISTIO / EXPIRADO | `neutral` | `Insignia` variante `neutral` |

---

## 3. Tipografía

### Jerarquía tipográfica

| Nivel | Uso | Clase / Estilo |
|-------|-----|----------------|
| `h1` / título de página | Solo en `EncabezadoPagina` | `font-size: var(--texto-xl)`, `font-weight: 600` |
| `h2` / subtítulo de sección | Encabezados de `SeccionTarjeta` | `font-size: var(--texto-lg)`, `font-weight: 500` |
| Texto normal | Contenido general | `font-size: var(--texto-base)` |
| Texto secundario | Metadatos, fechas, IDs internos | `font-size: var(--texto-sm)`, color `--color-texto-secundario` |
| Monoespaciado | Teléfonos, códigos, referencias técnicas | `font-family: var(--fuente-mono)` |

### Reglas de tipografía

- Los **teléfonos siempre en fuente mono** para alineación visual.
- Los **códigos de producto siempre en fuente mono**.
- Los **nombres de personas en mayúscula inicial** (no todo mayúsculas, no todo minúsculas).
- Las **fechas siguen el formato**: `"23 Ene 2024"` o `"23 Ene · 14:30"`. Nunca ISO 8601 crudo al usuario.
- Las **horas en formato 12h con am/pm** o **24h consistente** en todo el sistema — no mezclar.
- Los **precios siempre con símbolo de moneda** antes (`S/ 45.00`), dos decimales fijos.

---

## 4. Avatares e iniciales

Cuando no hay foto de perfil, se muestran las iniciales del nombre. Regla:

```
"Juan Pérez"    → "JP"
"María"         → "MA" (primeras dos letras si apellido no disponible)
"Luna IA"       → "LI"
```

- El color de fondo del avatar se asigna de forma determinista según el nombre (no random).
- El avatar tiene tamaño fijo: `32px` en tablas, `48px` en vistas de detalle, `64px` en perfiles.
- **Nunca mostrar UUID como texto alternativo** en un avatar.

---

## 5. Tablas de datos

### Reglas de columnas

- Primera columna: siempre identifica al registro de forma humana (nombre + dato de contacto).
- Columnas de fecha: formato corto `"23 Ene"` en tabla, formato largo en detalle.
- Columnas de estado: siempre `Insignia`, nunca texto plano.
- Columnas de monto: alineadas a la derecha, siempre con símbolo de moneda.
- Sin columnas "ID", "UUID", "Clave" o similares.
- Columna de acciones: siempre al final, con `MenuAcciones` (tres puntos).

### Estados de tabla

| Situación | Componente | Mensaje |
|-----------|-----------|---------|
| Cargando primera vez | `Esqueleto` (3-5 filas) | — |
| Sin resultados | `Vacio` | Mensaje específico por contexto |
| Error de red | `BannerAlerta` variante `error` | "No pudimos cargar los datos. Intenta de nuevo." |
| Buscando sin resultados | `Vacio` | "No encontramos resultados para '[búsqueda]'" |

### Paginación

- Por defecto mostrar los últimos 50 registros ordenados por fecha descendente.
- Si hay más de 50, mostrar botón "Cargar más" al final de la tabla.
- No paginar si hay menos de 20 registros.

---

## 6. Formularios y validaciones

### Reglas generales

- Todo campo obligatorio lleva `*` al lado del label (o indicador visual equivalente).
- Los errores de validación aparecen **debajo del campo**, en rojo, con texto descriptivo.
- Los errores de validación se muestran solo después de que el usuario interactuó con el campo (no en montaje).
- El botón de envío se deshabilita mientras el formulario está siendo enviado (spinner + texto "Guardando…").
- Después de un envío exitoso: toast verde + limpiar formulario (si es creación) o cerrar modal.

### Validaciones estándar por tipo de campo

| Campo | Validación | Mensaje de error |
|-------|-----------|-----------------|
| Texto obligatorio | `trim().length > 0` | "Este campo es obligatorio" |
| Email | Formato RFC 5322 | "Ingresa un correo electrónico válido" |
| Teléfono | Mínimo 7 dígitos numéricos | "El teléfono debe tener al menos 7 dígitos" |
| Contraseña nueva | Mínimo 8 caracteres | "La contraseña debe tener al menos 8 caracteres" |
| Confirmar contraseña | Igual a nueva | "Las contraseñas no coinciden" |
| Monto / Precio | `>= 0`, numérico | "Ingresa un monto válido mayor a cero" |
| Cantidad inventario | `!= 0`, numérico | "La cantidad no puede ser cero" |
| Hora fin > Hora inicio | Comparación | "La hora de fin debe ser posterior a la hora de inicio" |
| Fecha fin > Fecha inicio | Comparación | "La fecha de fin debe ser posterior a la fecha de inicio" |
| Sellos para recompensa | `>= 1` y `<= 50` | "Debe ser entre 1 y 50 sellos" |

### Placeholders

Los placeholders orientan, no reemplazan al label:

```
Nombre → "Ej: Juan Pérez"
Teléfono → "Ej: 987 654 321"
Email → "correo@ejemplo.com"
Código producto → "Ej: PROD-001"
Descripción → "Describe brevemente..."
```

---

## 7. Modales y diálogos de confirmación

### Tipos de modal

| Tipo | Cuándo usar | Color del botón de acción |
|------|------------|--------------------------|
| `normal` | Crear / editar entidades | Primario (azul) |
| `advertencia` | Acciones reversibles con impacto (suspender, desactivar) | Advertencia (amarillo) |
| `peligro` | Acciones irreversibles (cancelar, revocar, anular, eliminar) | Peligro (rojo) |

### Reglas de confirmación obligatoria

Las siguientes acciones **siempre requieren `DialogoConfirmacion`** antes de ejecutarse:

| Acción | Tipo |
|--------|------|
| Cancelar reserva | `peligro` |
| Revocar acceso (alcance) | `peligro` |
| Anular sello | `peligro` |
| Suspender suscripción | `advertencia` |
| Cancelar suscripción | `peligro` |
| Desactivar barbero / servicio / cliente | `advertencia` |
| Bloquear cliente | `peligro` |
| Eliminar excepción de disponibilidad | `advertencia` |
| Eliminar tarifa especial | `advertencia` |
| Cerrar período | `advertencia` |

### Texto del diálogo

```
Título: Verbo + objeto. Ej: "Cancelar reserva", "Revocar acceso"
Mensaje: Consecuencia en términos de negocio. Nunca mencionar IDs.
  Correcto: "Esta reserva de Juan Pérez el 23 de enero a las 14:30 quedará cancelada."
  Incorrecto: "¿Deseas cancelar el registro con ID abc-123?"
Botón confirmar: Mismo verbo del título. Ej: "Cancelar reserva", "Revocar"
Botón cancelar: "Volver"
```

---

## 8. Notificaciones toast

- Usar `sonner` (ya integrado) para todos los toasts.
- **Éxito:** verde, 3 segundos, mensaje afirmativo en pasado. Ej: "Reserva confirmada", "Barbero registrado".
- **Error:** rojo, 5 segundos, mensaje orientado a acción. Ej: "No pudimos confirmar la reserva. Intenta de nuevo."
- **Advertencia:** amarillo, 4 segundos. Ej: "El stock está por debajo del mínimo."
- **Nunca** incluir UUIDs ni códigos técnicos en el mensaje del toast.
- **Nunca** usar `alert()` del navegador.

---

## 9. Estados de carga

| Situación | Componente |
|-----------|-----------|
| Primera carga de página | `PantallaCarga` (spinner centrado) |
| Carga de tabla o listado | `Esqueleto` (filas grises animadas) |
| Envío de formulario | Botón con `disabled` + spinner inline |
| Carga de datos secundarios | `Cargando` (spinner pequeño inline) |
| Lazy load de página | `<Suspense fallback={null}>` (invisible, rápido) |

---

## 10. Estado vacío

Cada tabla o listado define su propio mensaje vacío en el componente `Vacio`:

| Contexto | Ícono sugerido | Mensaje |
|----------|---------------|---------|
| Sin reservas | `Calendar` | "No hay reservas registradas" |
| Sin barberos | `Users` | "Aún no tienes barberos en el equipo" |
| Sin clientes | `User` | "No hay clientes registrados aún" |
| Sin conversaciones | `MessageSquare` | "No hay conversaciones activas" |
| Sin sellos | `Star` | "Este cliente no tiene sellos acumulados" |
| Sin productos | `Package` | "No hay productos registrados" |
| Sin resultados de búsqueda | `Search` | "No encontramos resultados para tu búsqueda" |

---

## 11. Responsive y móvil

- **Sidebar**: colapsa en móvil, accesible con botón hamburguesa.
- **Tablas**: en móvil se convierten en tarjetas apiladas, con las columnas más importantes visibles.
- **Modales**: ancho máximo `90vw` en móvil, no forzar ancho fijo.
- **Formularios**: campos en columna completa en móvil (`grid-cols-1`), múltiples columnas en desktop (`grid-cols-2`).
- **Botones de acción**: en móvil el texto se trunca o se muestra solo el ícono.

---

## 12. Accesibilidad

- Todo campo de formulario tiene `label` asociado con `htmlFor`.
- Íconos decorativos llevan `aria-hidden="true"`.
- Íconos con significado semántico llevan `aria-label`.
- El foco de teclado sigue el orden visual lógico.
- El contraste mínimo entre texto y fondo es 4.5:1 (WCAG AA).
- Los modales trampa el foco mientras están abiertos.

---

## 13. Animaciones

Las animaciones usan las constantes de `plataforma/diseno/motion.ts`:

```typescript
springSuave   // transiciones de aparición suave
delayItem     // entrada escalonada en listas
```

- **Duración máxima**: 300ms para interacciones, 500ms para entradas de página.
- **Sin animaciones** en tablas con más de 20 filas (evitar jank).
- Las animaciones respetan `prefers-reduced-motion`.

---

## 14. Manejo de errores de red

| Código HTTP | Mensaje al usuario |
|-------------|-------------------|
| 400 | Mensaje específico del error de validación del backend |
| 401 | Redirigir a `/iniciar-sesion` con mensaje "Tu sesión expiró" |
| 403 | "No tienes permiso para realizar esta acción" |
| 404 | "No encontramos el recurso solicitado" |
| 409 | Mensaje específico del conflicto (ej: "Ya existe un barbero con ese nombre") |
| 500+ | "Ocurrió un error inesperado. Intenta de nuevo en unos minutos." |

El cliente HTTP (`integraciones/http/cliente.ts`) intercepta automáticamente el 401 y redirige.

---

## 15. Nombres de entidades en la UI

Seguir el lenguaje ubicuo. En la interfaz visible al usuario:

| Término correcto | NO usar |
|-----------------|---------|
| Barbero | Empleado, worker |
| Sede | Sucursal (solo en código interno), local |
| Reserva | Cita, appointment, booking |
| Servicio | Producto, item |
| Sello | Punto, stamp |
| Tarjeta de lealtad | Loyalty card |
| Programa de lealtad | Recompensas, rewards |
| Disponibilidad | Horario libre, slot |
| Período | Ciclo, mes |
| Cliente | Usuario, customer |
