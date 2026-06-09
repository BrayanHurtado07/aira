# PaginaVerificarCorreo — Especificación UI/UX
> Ruta: `/verificar-correo` · Rol: Público

---

## Propósito

Confirmación del correo electrónico del usuario tras el registro. Recibe un código vía email y lo valida.

---

## Layout

Pantalla centrada con ícono de email, título y campo de código.

---

## Flujo

1. El usuario recibe el código en su correo.
2. Ingresa el código en el campo.
3. Botón "Verificar".
4. Si es válido → redirigir a `/iniciar-sesion` con mensaje de éxito.

---

## Formulario

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|-----------|
| Código de verificación | `Campo` | ✅ | Solo dígitos, longitud exacta según lo enviado |

---

## Estados

| Situación | Mensaje |
|-----------|---------|
| Código inválido | "El código ingresado no es válido. Verifica tu correo." |
| Código expirado | "El código ha expirado. Solicita uno nuevo." |
| Ya verificado | "Tu correo ya fue verificado. Puedes iniciar sesión." |
| Éxito | Toast verde "Correo verificado. Ya puedes iniciar sesión." |

---

## Enlace de reenvío
- "¿No recibiste el código?" → botón "Reenviar código".
- Con debounce de 60 segundos antes de poder reenviar.
- Texto del botón con contador: "Reenviar en 45s".

---

## Reglas UX
- Nunca mostrar el `id_usuario` ni el token interno.
- El correo al que se envió el código se muestra ofuscado: `"j***@gmail.com"`.
