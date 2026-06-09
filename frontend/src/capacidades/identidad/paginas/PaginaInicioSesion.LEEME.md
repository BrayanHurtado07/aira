# PaginaInicioSesion — Especificación UI/UX
> Ruta: `/iniciar-sesion` · Rol: Público (sin auth)

---

## Propósito

Autenticación del usuario para acceder al panel de administración.

---

## Layout

Pantalla centrada con el logo de AIRA, formulario y enlaces de recuperación.

---

## Formulario

| Campo | Tipo | Obligatorio | Validación | Placeholder |
|-------|------|-------------|-----------|-------------|
| Correo electrónico | `CampoEmail` | ✅ | Formato email | "correo@barberia.com" |
| Contraseña | `input[type=password]` | ✅ | `length > 0` | — |

- Botón "Iniciar sesión" — texto cambia a "Ingresando…" durante el envío.
- Opción de mostrar / ocultar contraseña (ícono ojo).

---

## Errores

| Situación | Mensaje |
|-----------|---------|
| Credenciales incorrectas | "Correo o contraseña incorrectos." (no distinguir cuál falla — seguridad) |
| Usuario inactivo | "Tu cuenta está inactiva. Contacta al administrador." |
| Error de red | "No pudimos conectar con el servidor. Verifica tu conexión." |

**Nunca** mostrar mensajes técnicos como "401 Unauthorized" ni UUIDs en mensajes de error.

---

## Enlaces
- "¿Olvidaste tu contraseña?" → `/solicitar-reset`
- Si la cuenta no está verificada, mostrar banner: "Verifica tu correo para acceder." con enlace a reenviar verificación.

---

## Comportamiento post-login
- Si el usuario tiene rol `Admin` → redirigir a `/tablero`.
- Si el usuario tiene rol `Barbero` → redirigir a `/tablero` (vista diferenciada).
- Si ya hay sesión activa al entrar a `/iniciar-sesion` → redirigir a `/tablero`.
