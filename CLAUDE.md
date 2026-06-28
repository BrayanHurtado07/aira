# CLAUDE.md — Serbio Barbería

> Este archivo define las reglas de trabajo obligatorias para Claude en este proyecto.
> Aplica a toda solicitud: nueva funcionalidad, correccion de bugs, consultas tecnicas, revision de codigo.

---

## Proyecto

**Nombre:** Serbio — Chatbot de barberia por WhatsApp
**Arquitectura:** SaaS Composable bajo estandar Codeplex
**Stack:** Go (backend) · CockroachDB (base de datos) · React + TypeScript (frontend)

---

## Reglas de trabajo — OBLIGATORIAS

### 1. Lenguaje ubicuo en espanol

Todo codigo propio del dominio se escribe en espanol. Sin excepcion.

```
PROHIBIDO en dominio:  LoginPage, UserService, createUser, handleSubmit
CORRECTO en dominio:   PaginaInicioSesion, ServicioIdentidad, registrar_usuario, enviarFormulario
PERMITIDO (stack):     React, Go, Vite, JWT, HTTP, JSON, useState, useEffect, uuid
```

### 2. Programar por intencion de negocio, no por carpeta tecnica

```
PROHIBIDO: Login, UserService, ApiService, Helpers, Utils
CORRECTO:  iniciar_sesion_global, registrar_reserva, cancelar_reserva, validar_contexto_coherente
```

### 3. Respetar el mapa mental 3DD en todo codigo Go

```
Entrada HTTP → Manejador → Caso de uso → Politicas de dominio → Controles tecnicos → Repositorios → Eventos y auditoria → Respuesta
```
- El manejador NO gobierna
- El repositorio NO decide
- El frontend NO autoriza
- El dominio define la verdad

### 4. Las 10 reglas de programacion (siempre)

1. Usar nombres del lenguaje ubicuo
2. Evitar servicios dios
3. Todo codigo del dominio en espanol
4. Manejadores libres de logica de negocio
5. Sin `else if` encadenados — usar estrategia o tabla de reglas
6. Sin `if` anidados — usar retornos tempranos
7. Sin `for` anidados en validaciones de dominio
8. Errores de dominio (`ErrReservaNoConfirmable`), no strings (`errors.New("error")`)
9. Separar politica de dominio, control tecnico y persistencia
10. Registrar auditoria en operaciones relevantes

### 5. Antes de responder cualquier pregunta tecnica — aplicar el criterio de 7 puntos

1. Que concepto me estan preguntando
2. En que fase aparece (1-11)
3. Que problema resuelve
4. En que capa vive (gobierno / dominio / contexto / infraestructura)
5. Que entidad, tabla o contrato toca
6. Que politica o control aplica
7. Que error ocurriria si se implementa mal

---

## Capacidades del dominio — Serbio Barberia

| Capacidad | Responsabilidad | Tablas propias |
|-----------|----------------|----------------|
| **Identidad** | Usuarios (barberos/admins), sesiones, autenticacion | `usuario`, `sesion_global`, `verificacion_correo_electronico` |
| **Organizacion** | Empresa (barberia cliente), sucursal (sede), periodo | `empresa`, `sucursal`, `periodo` |
| **Gobierno de Acceso** | Roles, permisos, alcances, auditoria | `rol`, `permiso`, `rol_permiso`, `alcance`, `auditoria_accion` |
| **Agenda** | Barberos, servicios, disponibilidad | `barbero`, `servicio`, `disponibilidad` |
| **Reservas** | Reservas de clientes | `reserva`, `reserva_servicio`, `cliente` |
| **Canal WhatsApp** | Conversaciones, mensajes, bot Serbio, Luna IA | `conversacion`, `mensaje`, `sesion_chat`, `sesion_whatsapp_empresa`, `indicacion_luna` |
| **Monetizacion** | Planes SaaS, suscripciones, compuertas de plan | `plan`, `plan_limite`, `suscripcion` |
| **Lealtad** | Programa de sellos, tarjetas, recompensas | `programa_lealtad`, `tarjeta_lealtad`, `sello` |
| **Notificaciones** | Recordatorios automaticos, plantillas, logs | `plantilla_mensaje`, `recordatorio_programado`, `log_notificacion` |

---

## Lenguaje ubicuo obligatorio

| Termino correcto | NO usar |
|-----------------|---------|
| barberia | company, negocio, tienda |
| sede | branch, local |
| periodo | month, ciclo |
| cliente | user, customer, contact |
| barbero | barber, worker, empleado |
| servicio | product, item, trabajo |
| reserva | appointment, booking, cita |
| disponibilidad | slot, horario_libre |
| canal | source, channel |
| sesion_global | auth_row, token_row |
| alcance | access, grant |
| sello | stamp, punto, puntos |
| tarjeta_lealtad | loyalty_card, rewards_card |
| programa_lealtad | rewards, fidelizacion |
| suscripcion | subscription, membresia |
| compuerta_plan | feature_flag, gate |
| reserva_publica | booking, public_appointment |
| luna | bot_ia, ai_assistant |

---

## Guias de referencia — leer antes de implementar

| Guia | Fases | Cuando usarla |
|------|-------|--------------|
| `GUIA-BASE-DATOS.md` | 1–6 | Antes de crear/modificar tablas, indices o stored procedures |
| `GUIA-BACKEND.md` | 7–8 | Antes de crear casos de uso, manejadores, contratos Go |
| `GUIA-FRONTEND.md` | 7–8 | Antes de crear paginas, componentes, ganchos, servicios React |
| `GUIA-FASE09-INTERACCION-CAPACIDADES.md` | 9 | Antes de crear interacciones entre capacidades |
| `GUIA-FASE10-EVENTOS-DOMINIO.md` | 10 | Antes de definir o implementar eventos de dominio |
| `GUIA-FASE11-SEGURIDAD.md` | 11 | Antes de implementar validaciones de acceso o seguridad |
| `CODEPLEX.md` | — | Referencia maestra del estandar completo |
| `ventascodeplex.md` | — | Ejemplo real del estandar aplicado en proyecto Ventas |

---

## Antipatrones prohibidos — NUNCA generar esto

### Base de datos
- `ON DELETE CASCADE` en tablas de negocio
- Datos derivados persistidos (`precio_total`, `esta_disponible`, `nombre_barbero` en `reserva`)
- PK autoincremental o con significado de negocio
- Token en claro en cualquier columna
- Eliminacion fisica de registros de negocio (`DELETE FROM reserva`)

### Backend Go
- Manejador con logica de negocio (validaciones de estado, reglas del dominio)
- Servicio dios (que mezcla identidad + sesion + reservas + agenda)
- `if (rol == "admin")` en cualquier capa
- Consulta directa de una capacidad a tablas de otra capacidad
- Mezcla de ingles y espanol en nombres del dominio

### Frontend React/TypeScript
- `if (user.role === 'admin')` en componentes
- `localStorage.getItem('token')` directo sin pasar por `plataforma/identidad/`
- `api.ts` gigante con todas las llamadas del sistema
- Pagina que maneja su propia autenticacion en lugar de usar `GuardiaAutenticacion`
- Servicio con nombre `postData`, `saveForm`, `handleApiCall` en lugar de nombre de dominio

---

## Checklist de PR — responder SI a todo

- [ ] Nombres de funciones en espanol representando operaciones de dominio
- [ ] Funcion vive en la capacidad correcta
- [ ] Manejador libre de reglas de negocio
- [ ] Politicas de dominio centralizadas, no repetidas
- [ ] Controles tecnicos separados de politicas de dominio
- [ ] Contexto operativo (barberia + sede + periodo) validado antes de operar
- [ ] Autorizacion = permiso + rol + alcance + contexto (no solo JWT)
- [ ] Auditoria registra operaciones sensibles
- [ ] Frontend no inventa decisiones del backend
- [ ] Sin servicios dios, if anidados ni helpers genericos
- [ ] Sin datos derivados en BD
- [ ] Sin mezcla de ingles y espanol en dominio

---

*Estandar: Codeplex — Arquitectura Composable*
*Proyecto: Serbio Barberia*
*Actualizado: 2026-05-15*
