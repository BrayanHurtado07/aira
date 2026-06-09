# PaginaRestablecerPassword + PaginaSolicitarReset — Especificación UI/UX
> Rutas: `/solicitar-reset` y `/restablecer-password` · Rol: Público

---

## Flujo completo de recuperación

```
/solicitar-reset  →  (email con enlace)  →  /restablecer-password?token=...  →  /iniciar-sesion
```

---

## PaginaSolicitarReset (`/solicitar-reset`)

### Propósito
El usuario ingresa su correo y recibe un enlace para restablecer su contraseña.

### Formulario
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Correo electrónico | `CampoEmail` | ✅ | Formato email |

### Comportamiento
- Si el correo existe: toast verde "Te enviamos un enlace a tu correo." (mismo mensaje aunque no exista — seguridad).
- No revelar si el correo está registrado o no.
- El enlace en el email tiene un token opaco — el usuario nunca lo ve directamente.
- Enlace "Volver al inicio de sesión".

---

## PaginaRestablecerPassword (`/restablecer-password`)

### Propósito
El usuario llega desde el enlace del email y elige una nueva contraseña.

### Formulario
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Nueva contraseña | `input[type=password]` | ✅ | `>= 8 caracteres` |
| Confirmar nueva contraseña | `input[type=password]` | ✅ | `== nueva contraseña` |

### Errores
| Situación | Mensaje |
|-----------|---------|
| Token expirado | "El enlace ha expirado. Solicita uno nuevo." + botón a `/solicitar-reset` |
| Token inválido | "El enlace no es válido. Solicita uno nuevo." |
| No coinciden | "Las contraseñas no coinciden." |
| Muy corta | "La contraseña debe tener al menos 8 caracteres." |

- Al éxito: toast verde "Contraseña actualizada." + redirigir a `/iniciar-sesion`.

---

## Reglas UX
- El token del URL nunca se muestra al usuario ni en mensajes de error.
- Los campos de contraseña tienen opción de mostrar / ocultar.
- Si el enlace ya fue usado, mostrar mensaje claro en lugar de error técnico.
