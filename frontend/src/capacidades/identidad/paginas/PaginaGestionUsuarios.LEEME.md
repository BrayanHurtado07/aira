# PaginaGestionUsuarios — Especificación UI/UX
> Ruta: `/usuarios` · Rol: Admin

---

## Propósito

Gestión de usuarios del sistema (administradores y barberos con acceso a la plataforma).

---

## Layout: 2 pestañas

**Usuarios** · **Cambiar contraseña**

---

## Pestaña 1: Usuarios

### Indicador
- Chip: "X usuarios" con ícono `Shield`.

### Tabla de usuarios
| Columna | Dato | Formato | Nunca mostrar |
|---------|------|---------|---------------|
| Usuario | Nombre + correo | Avatar con iniciales + nombre + correo en mono | `id_usuario` |
| Estado | `estado` | `Insignia` | Código |
| Acciones | — | Inactivar (si ACTIVO) | — |

### Inactivar usuario
- `DialogoConfirmacion` variante `advertencia`.
- Texto: "[Nombre] quedará inactivo y no podrá iniciar sesión."
- Al éxito: toast amarillo "Usuario inactivado."

---

## Pestaña 2: Cambiar contraseña

Para que el usuario cambie su propia contraseña.

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Contraseña actual | `input[type=password]` | ✅ | — |
| Nueva contraseña | `input[type=password]` | ✅ | `>= 8 caracteres` |
| Confirmar nueva contraseña | `input[type=password]` | ✅ | `== nueva contraseña` |

### Errores inline
- Nueva contraseña < 8 chars: "La contraseña debe tener al menos 8 caracteres."
- No coinciden: "Las contraseñas no coinciden."
- Contraseña actual incorrecta: "La contraseña actual no es correcta."

- Al éxito: toast verde "Contraseña actualizada."

---

## Reglas UX
- Nunca mostrar `id_usuario` en ninguna parte.
- El correo en fuente monoespaciada.
- Los campos de contraseña tienen opción de mostrar / ocultar.
