# PaginaGestionClientes — Especificación UI/UX
> Ruta: `/reservas/clientes` · Rol: Admin + Barbero

---

## Propósito

Directorio de clientes de la barbería. Registro, edición y cambio de estado.

---

## Buscador

- Campo de texto con ícono de lupa.
- Búsqueda en tiempo real por nombre, teléfono o correo.
- Resultado vacío: "No encontramos resultados para '[término]'".

---

## Tabla de clientes

### Columnas
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Cliente | Nombre + teléfono | Avatar con iniciales + nombre + teléfono en mono | `id_cliente` |
| Correo | `correo_electronico` | Texto en mono gris; si vacío: "—" en gris | — |
| Estado | `estado` | `Selector` con dot de color o `Insignia` | Código interno |
| Acciones | — | `MenuAcciones` (editar, cambiar estado) | — |

### Estados del cliente
| Estado | Color dot / Insignia | Significado |
|--------|---------------------|-------------|
| ACTIVO | Verde | Puede reservar normalmente |
| INACTIVO | Gris | Sin acceso temporalmente |
| BLOQUEADO | Rojo | Bloqueado permanentemente |

---

## Registrar nuevo cliente

| Campo | Tipo | Obligatorio | Validación | Placeholder |
|-------|------|-------------|-----------|-------------|
| Nombre completo | `Campo` | ✅ | `trim().length > 0` | "Ej: María García" |
| Teléfono | `SelectorTelefono` | ✅ | Mínimo 7 dígitos | "987 654 321" |
| Correo electrónico | `CampoEmail` | No | Formato email si se ingresa | "correo@ejemplo.com" |
| Fecha nacimiento | `SelectorFecha` | No | No futura | — |

- Error 409: "Ya existe un cliente con ese teléfono en esta barbería."

---

## Editar cliente

- Modal con mismos campos prellenados.
- El teléfono puede editarse (si no colisiona con otro cliente).

---

## Cambiar estado

| Transición | Tipo confirmación | Texto |
|-----------|------------------|-------|
| ACTIVO → INACTIVO | `advertencia` | "[Nombre] no podrá recibir reservas mientras esté inactivo." |
| INACTIVO → ACTIVO | Sin confirmación | Toast verde "Cliente activado" |
| Cualquiera → BLOQUEADO | `peligro` | "[Nombre] quedará bloqueado y no podrá reservar." |

---

## Estado vacío
- Ícono: `Users`
- Mensaje: "No hay clientes registrados aún"
- Acción: botón "Registrar primer cliente"

---

## Reglas UX
- El teléfono siempre en fuente monoespaciada.
- Si el correo no existe, mostrar `"—"` en gris, no una celda vacía.
- Las iniciales del avatar toman las primeras dos letras del nombre si no hay apellido.
