---
name: revisar-codeplex
description: Quality gate de Aira. Revisa un diff (cambios sin commitear o de un commit) contra el estándar Codeplex — las 10 reglas, los antipatrones prohibidos y el lenguaje ubicuo en español. Úsala ANTES de dar por terminado cualquier arreglo o feature. Solo revisa el diff, no el repo entero (barato en tokens).
---

# revisar-codeplex — Quality gate (revisa el diff, no el repo)

Objetivo: que ningún cambio entre al proyecto violando el estándar. Es un GATE, no un refactor masivo:
revisa SOLO lo que cambió.

## Entrada
El diff actual: `git -C /Users/lorem/Documents/aira diff` (y `git diff --staged`). Si se indica un archivo o
capacidad, limitar a eso. NO leer el repo completo; solo los archivos tocados + su contexto inmediato.

## Checklist (marca cada hallazgo con archivo:línea + severidad 🔴/🟡 + arreglo)

### A. Las 10 reglas
1. Nombres del lenguaje ubicuo (dominio en español: `registrar_reserva`, no `createBooking`).
2. Sin servicios dios (una pieza que mezcla identidad+sesión+reservas+agenda).
3. Todo el dominio en español (stack permitido: React, Go, JWT, uuid, useState…).
4. **Manejador sin lógica de negocio** (validaciones de estado/reglas viven en el caso de uso, no en el handler HTTP).
5. Sin `else if` encadenados → estrategia o tabla de reglas.
6. Sin `if` anidados → retornos tempranos.
7. Sin `for` anidados en validaciones de dominio.
8. Errores de dominio tipados (`ErrReservaNoConfirmable`), no `errors.New("...")` ni strings sueltos.
9. Separar política de dominio · control técnico · persistencia.
10. (Auditoría — DIFERIDA: no exigirla, no marcarla como hallazgo).

### B. Antipatrones prohibidos
- **BD:** `ON DELETE CASCADE` en tablas de negocio · datos derivados persistidos (precio_total, esta_disponible) ·
  PK autoincremental o con significado · token en claro · `DELETE` físico de registros de negocio.
- **Backend Go:** manejador con reglas de negocio · servicio dios · `if (rol == "admin")` en cualquier capa ·
  una capacidad consultando tablas de OTRA capacidad directo · mezcla inglés/español en el dominio.
- **Frontend:** `if (user.role === 'admin')` en componentes · `localStorage.getItem('token')` directo ·
  `api.ts` gigante · página que maneja su propia auth en vez de `GuardiaAutenticacion` · servicios tipo `postData`.

### C. Coherencia con el esquema (clave en Aira)
- Que las queries/inserts usen columnas y estados que EXISTEN (causa real de bugs: `estado='ACTIVO'` cuando el
  CHECK pide `'VALIDO'`; `origen='web_publica'` cuando el CHECK pide `WHATSAPP|WEB|MANUAL`). Si el diff toca SQL o
  un repo, verificar contra el DDL real de esa tabla.
- Funciones almacenadas deben devolver el contrato `{exito, error, datos}`.

### D. Acceso (si el diff toca un endpoint de escritura)
- ¿Valida permiso (handler `autorizarOResponder` o caso de uso `validador.ValidarPermiso`)? ¿Valida contexto
  empresa+sede+periodo cuando aplica? Para auditoría profunda de acceso, delegar en la skill `guardia-acceso`.

## Salida (formato exacto)
```
GATE CODEPLEX — <archivos revisados>
🔴 Bloqueantes: <n>
  - archivo:línea — <regla/antipatrón> — <arreglo concreto>
🟡 Menores: <n>
  - ...
✅ Cumple: <lista breve de lo que está bien>
VEREDICTO: APROBADO / CAMBIOS REQUERIDOS
```
Si hay 🔴, NO está aprobado. No edites archivos; solo dictamina (quien llama aplica los arreglos).
