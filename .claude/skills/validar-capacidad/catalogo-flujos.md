# Catálogo de flujos de negocio reales — Aira

Flujos descritos desde la perspectiva del **dueño de barbería / barbero / cliente**, no de las tablas.
Cada flujo es una pregunta que el negocio debe poder responder. La skill `validar-capacidad` evalúa
si la BD → función → backend → acceso pueden responderla de punta a punta.

> Regla: si un "flujo" se puede reescribir como "listar tabla X" o "crear registro en X", NO es un flujo
> de negocio, es CRUD. Subir el nivel hasta la necesidad real.

---

## agenda
1. **"¿Qué barberos están disponibles en la Sede Centro el sábado a las 3pm para un fade?"**
   Requiere cruzar: sucursal activa + barberos de esa sede + servicios que ofrece cada barbero +
   disponibilidad del día/hora - excepciones (vacaciones/feriados) - slots ya reservados, considerando
   la duración del servicio.
2. **"¿Qué servicios puede ofrecer Carlos y cuánto cuestan hoy?"** (incluye tarifa especial vigente si aplica).
3. **"Bloquear la agenda de Diego el 28 de junio porque está de vacaciones."** (excepción de disponibilidad).
4. **"¿Cuál es el próximo hueco libre de 45 min de cualquier barbero en esta sede?"**

Funciones esperadas: algo tipo `barbero_disponibles_por_sede`, `disponibilidad_*`,
`excepcion_disponibilidad_registrar`. Si la disponibilidad real se calcula a mano en Go, es un hueco.

## reservas
1. **"Agendar un corte para el cliente Juan el sábado 3pm con Carlos en Sede Centro."**
   Debe validar: contexto (empresa+sede+periodo), sucursal activa, suscripción vigente de la empresa,
   slot realmente libre, servicio asignado al barbero, y marcar la disponibilidad como reservada (atómico).
2. **"Confirmar / cancelar / completar una reserva"** (transiciones de estado válidas, no cualquier salto).
3. **"El cliente no asistió"** → marcar no-asistencia (¿existe el estado y el caso de uso?).
4. **"Agregar un producto/complemento a una reserva ya creada"** (precio congelado al momento).
5. **"Meter a un cliente en lista de espera cuando no hay slot"** y promoverlo cuando se libere.

Clave: la disponibilidad debe liberarse al cancelar (`disponibilidad_liberar`) y bloquearse al reservar.

## reserva-publica (cliente externo, SIN sesión)
1. **"Un cliente entra por el link público de la sede, ve barberos y servicios, elige hueco y reserva sin loguearse."**
   Endpoints `/api/publico/*`. Validar que NO exijan token pero SÍ validen sucursal activa + suscripción +
   que el slot siga libre al confirmar (evitar doble reserva por carrera).
2. **"¿La sede tiene un slug público válido y activo?"** (resolver `sucursalSlug` → sucursal).

## organizacion
1. **"Dar de alta una nueva barbería con su primera sede y su periodo de operación."** (onboarding).
2. **"¿Está activa esta sucursal para poder operar?"** (toda operación de negocio depende de esto).
3. **"Configurar la barbería: anticipación mínima de reserva, si requiere confirmación manual, horarios."**
   (`configuracion_empresa`). Sin esto, los parámetros quedan fijos para siempre.
4. **"Cerrar un periodo"** y qué implica para reservas/comisiones de ese periodo.

## monetizacion
1. **"¿Esta empresa tiene una suscripción ACTIVA que le permite operar / crear reservas?"**
   Es una compuerta transversal: reservas, agenda, etc. deberían consultarla.
2. **"¿Esta empresa superó el límite de su plan (N sedes, N barberos, N reservas/mes)?"**
   Validar `plan_limite` antes de permitir crear. Si no se valida, el plan no significa nada comercialmente.
3. **"Activar / suspender / cancelar una suscripción."** (hoy esqueleto, sin pasarela — anotar, no es bloqueante del flujo de datos).

## lealtad
1. **"El cliente Juan acumuló su 5º sello; ¿ya puede canjear un corte gratis?"** (programa → tarjeta → sellos → canje).
2. **"Crear el programa de lealtad de la barbería"** (sin esto, una barbería nueva no tiene lealtad).
3. **"Anular un sello mal otorgado."**

## gobierno_acceso (roles · alcances · permisos)
1. **"Un barbero NO debe poder crear sucursales ni ver finanzas; un admin SÍ."**
   Verificar que los endpoints de escritura validen `permiso + alcance + rol + contexto`, no solo JWT.
2. **"Asignar / revocar el alcance de un usuario a una empresa con un rol."**
3. **"¿Qué puede hacer este usuario en esta empresa?"** (resolver permisos efectivos).
   Cruzar con `codigos.go`: cada operación sensible debe tener su código de permiso y usarse.

## identidad
1. **"Registrar usuario, iniciar sesión, refrescar sesión, cerrar sesión."** (flujo base, ya maduro).
2. **"Verificar correo / restablecer contraseña"** (depende de SMTP real — hoy log-only, anotar).
3. **"Inactivar un usuario sin borrarlo"** (soft-delete).

## canal_whatsapp
1. **"Un cliente escribe por WhatsApp 'quiero un corte mañana' y el bot Luna responde y agenda sin humano."**
   Hoy es esqueleto/log-only — el diferenciador de venta. Validar qué existe vs qué falta para IA real.
2. **"Ver el historial de conversación de un cliente y poder intervenir manualmente."**

## inventario
1. **"¿Cuánto stock de cera queda en la Sede Centro?"** (stock por sucursal — ¿existe `GET stock`?).
2. **"Registrar entrada/salida de producto y que el stock se refleje."** (movimiento → stock coherente).

## notificaciones
1. **"Recordar al cliente su cita 2 horas antes por WhatsApp, automáticamente."**
   (recordatorio programado + worker que lo despacha). Validar que el worker realmente despache.
2. **"Plantillas reutilizables de mensaje por empresa."**

---

## Capacidades solo-BD (sin Go/UI) — flujos a tener listos antes de construir
- **comisiones**: "¿Cuánto le toca a Carlos este periodo por sus servicios completados?" (esquema → comisión por reserva → liquidación → pago).
- **reputacion**: "El cliente califica al barbero y deja reseña tras su corte; mostrar promedio por barbero/sede."
- **campanias**: "Enviar promo a clientes que no vienen hace 60 días, automáticamente."
- **integraciones**: "Sincronizar las reservas con el Google Calendar del barbero."
