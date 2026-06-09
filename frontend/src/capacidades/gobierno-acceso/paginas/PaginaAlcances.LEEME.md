# PaginaAlcances — Especificación UI/UX
> Ruta: `/gobierno-acceso` · Rol: Admin

---

## Propósito

Control de quién puede acceder a qué en la plataforma. Asignación y revocación de roles a usuarios.

---

## Layout: 2 pestañas

**Accesos activos** · **Asignar acceso**

---

## Pestaña 1: Accesos activos

### Indicador
- Chip: "X accesos activos" con ícono `CheckCircle2`.

### Tabla de alcances
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Usuario | Nombre + correo | Avatar con iniciales + nombre + correo en mono gris | `id_usuario`, `id_alcance` |
| Rol | Nombre del rol | Ícono `Shield` + nombre (ej: "Administrador", "Barbero") | `id_rol` |
| Estado | `estado` | `Insignia` | Código |
| Asignado el | `creado_en` | `"23 Ene 2025"` | Fecha ISO |
| Acciones | — | Revocar (solo ACTIVO) | — |

### Revocar acceso
- `DialogoConfirmacion` variante `peligro`.
- Texto: "El acceso de [Nombre usuario] como [Rol] quedará revocado inmediatamente."
- Al éxito: toast rojo "Acceso revocado."

---

## Pestaña 2: Asignar acceso

### Buscar usuario
- `Campo` con ícono `Search`.
- Búsqueda por nombre o correo.
- Resultados en dropdown: avatar + nombre + correo.
- Nunca mostrar `id_usuario` en los resultados.

### Seleccionar rol
- Botones clicables con nombre del rol y descripción breve.
- Ejemplo: `[Admin]` — "Acceso completo a todas las funciones" · `[Barbero]` — "Solo gestión de reservas propias".

### Preview
Cuando ambos campos están completos:
> "[Nombre usuario] tendrá acceso como [Nombre rol]."

### Botón "Asignar acceso"
- Deshabilitado hasta tener usuario + rol.
- Al éxito: toast verde "Acceso asignado."
- Error 409: "[Nombre usuario] ya tiene un acceso activo con ese rol."

---

## Reglas UX

- Los roles se muestran con nombre en español claro, no con códigos internos.
- Nunca mostrar `id_alcance`, `id_rol`, `id_usuario` al usuario.
- El correo del usuario va en fuente monoespaciada.
