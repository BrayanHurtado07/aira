# AIRA — Estado Backend Go
> Inventario completo de casos de uso, repositorios, rutas HTTP y brechas de implementación.
> Actualizado: 2026-05-28

---

## Arquitectura general

```
HTTP (Chi)
  └── rutas.go (70+ endpoints)
        └── Manejadores (handlers en rutas.go)
              └── Casos de uso (capacidades/[dominio]/casos_uso/)
                    ├── Repositorios (capacidades/[dominio]/*/repositorio.go)
                    │     └── CockroachDB (persistencia/cockroach/*.go via proc.go)
                    ├── Publicador de eventos (compartido/eventos/)
                    └── Auditor (plataforma/gobierno/auditoria/)
```

**Patrón obligatorio (3DD):**
```
Entrada HTTP → Manejador → Caso de uso → Políticas de dominio → Controles técnicos → Repositorios → Eventos y auditoría → Respuesta
```

---

## Casos de uso implementados (31)

### Identidad — `/capacidades/identidad/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| RegistrarUsuario | `registrar_usuario.go` | `usuario_registrar` | UsuarioRegistrado | ✅ |
| IniciarSesionGlobal | `iniciar_sesion_global.go` | `usuario_iniciar_sesion` | SesionIniciada | ✅ + ObtenerNombreRol |
| CerrarSesion | `cerrar_sesion.go` | `usuario_cerrar_sesion` | SesionRevocada | ✅ |
| InactivarUsuario | `inactivar_usuario.go` | — (UPDATE directo) | UsuarioInactivado | ✅ |
| CambiarPassword | `cambiar_password.go` | — (UPDATE directo) | PasswordCambiado | ✅ |

**Falta:**
- `VerificarCorreo` — usa `usuario_verificar_correo` + `verificacion_correo_crear` — **sin implementar**
- `RenovarSesion` — refresh token en DB pero sin lógica Go
- `RestablecerPassword` — sin flujo de recuperación

### Organización — `/capacidades/organizacion/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| CrearEmpresa | `crear_empresa.go` | `empresa_crear` | BarberiaCreada | ✅ |
| CrearSucursal | `crear_sucursal.go` | `sucursal_crear` | SedeCreada | ✅ |
| CrearPeriodo | `crear_periodo.go` | `periodo_crear` | PeriodoAbierto | ✅ |
| CerrarPeriodo | `cerrar_periodo.go` | — (UPDATE directo) | PeriodoCerrado | ✅ |

**Falta:**
- `GuardarConfiguracionEmpresa` — usa `configuracion_empresa_guardar` — **sin implementar**
- `ObtenerConfiguracionEmpresa` — sin endpoint GET para config

### Gobierno de Acceso — `/capacidades/gobierno_acceso/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| AsignarAlcance | `asignar_alcance.go` | `alcance_asignar` | AlcanceAsignado | ✅ |
| RevocarAlcance | `revocar_alcance.go` | `alcance_revocar` | AlcanceRevocado | ✅ |

**Falta:**
- CRUD de roles y permisos — actualmente solo se listan (seed data)
- Validación de límites de plan en `GuardiaPoliticas` — definida pero no integrada a handlers

### Agenda — `/capacidades/agenda/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| RegistrarBarbero | `registrar_barbero.go` | `barbero_registrar` | BarberoRegistrado | ✅ |
| CrearServicio | `crear_servicio.go` | `servicio_crear` | ServicioRegistrado | ✅ |
| RegistrarDisponibilidad | `registrar_disponibilidad.go` | `disponibilidad_registrar` | DisponibilidadCreada | ✅ |
| AsignarServicioBarbero | `asignar_servicio_barbero.go` | `barbero_servicio_asignar` | — | ✅ |

**Falta:**
- `RegistrarExcepcionDisponibilidad` — usa `excepcion_disponibilidad_registrar` — **sin implementar**
- `CrearTarifaEspecial` — usa `tarifa_especial_crear` — **sin implementar**
- Actualización de barbero tiene endpoint `PATCH /api/barberos/{id}` pero **no hay caso de uso** — el handler llama directo al repo
- Actualización de servicio igual — handler llama directo al repo sin caso de uso

### Reservas — `/capacidades/reservas/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| RegistrarCliente | `registrar_cliente.go` | `cliente_registrar` | — | ✅ |
| RegistrarReserva | `registrar_reserva.go` | `reserva_crear` | ReservaCreada | ✅ |
| ConfirmarReserva | `confirmar_reserva.go` | `reserva_confirmar` | ReservaConfirmada | ✅ |
| CancelarReserva | `cancelar_reserva.go` | `reserva_cancelar` | ReservaCancelada | ✅ |
| CompletarReserva | `completar_reserva.go` | `reserva_completar` | ReservaCompletada | ✅ |

**Falta:**
- `AgregarComplementoReserva` — usa `complemento_reserva_agregar` — **sin implementar**
- `IngresarListaEspera` — usa `lista_espera_ingresar` — **sin implementar**
- `MarcarNoAsistio` — estado `NO_ASISTIO` existe en DB, sin caso de uso ni endpoint

### Canal WhatsApp — `/capacidades/canal_whatsapp/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| IniciarConversacion | `iniciar_conversacion.go` | `conversacion_iniciar` | ConversacionAbierta | ✅ |
| RegistrarMensaje | `registrar_mensaje.go` | `mensaje_registrar` | — | ✅ |
| GestionarSesionChat | `gestionar_sesion_chat.go` | `sesion_chat_iniciar` + `sesion_chat_actualizar` | — | ✅ |
| AtenderChat | `atender_chat.go` | — (orquestador) | — | ✅ (usa contratos) |

**Falta:**
- `GestionarSesionWhatsAppEmpresa` — tabla `sesion_whatsapp_empresa` sin endpoint
- `CrearIndicacionBot` — tabla `indicacion_bot` sin CRUD
- Lógica real del bot Serbio/Luna IA — `atender_chat.go` es un orquestador base

### Monetización — `/capacidades/monetizacion/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| ActivarSuscripcion | `activar_suscripcion.go` | `suscripcion_activar` | — | ✅ |
| SuspenderSuscripcion | `suspender_suscripcion.go` | `suscripcion_suspender` | — | ✅ |
| CancelarSuscripcion | `cancelar_suscripcion.go` | `suscripcion_cancelar` | — | ✅ |

**Falta:**
- Validación de `plan_limite` — `control_por_plan.go` solo verifica existencia de suscripción activa, no valida límites (MAX_BARBEROS, MAX_SUCURSALES, etc.)

### Lealtad — `/capacidades/lealtad/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| AcumularSello | `acumular_sello.go` | `sello_acumular` | — | ✅ |
| AnularSello | `anular_sello.go` | `sello_anular` | — | ✅ |
| AplicarCanje | `aplicar_canje.go` | `canje_recompensa_aplicar` | — | ✅ |

**Falta:**
- `CrearProgramaLealtad` — usa `programa_lealtad_crear` — **sin implementar** (la tabla se asume ya poblada)
- `ActualizarProgramaLealtad` — sin implementar

### Notificaciones — `/capacidades/notificaciones/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| ProgramarRecordatorio | `programar_recordatorio.go` | `recordatorio_programar` | — | ✅ |
| CancelarRecordatorio | `cancelar_recordatorio.go` | `recordatorio_cancelar` | — | ✅ |

**Falta:**
- `CrearPlantillaMensaje` — usa `plantilla_mensaje_crear` — **sin implementar**
- Worker de envío — recordatorios se programan pero **nadie los despacha** (sin cron/worker)

---

## Capacidades completamente ausentes en Go (5)

### ❌ Comisiones — `/capacidades/comisiones/` (NO EXISTE)

Requiere crear desde cero:
- Entidad `EsquemaComision`, `Liquidacion`, `Comision`
- Repositorios con `RepositorioComisionCockroach`
- Casos de uso: `CrearEsquemaComision`, `GenerarComision`, `CalcularLiquidacion`, `AprobarLiquidacion`, `PagarLiquidacion`
- Endpoints: 8 nuevos
- Funciones almacenadas ya listas: `esquema_comision_crear`, `comision_generar`, `liquidacion_calcular`, `liquidacion_aprobar`, `liquidacion_pagar`

### ❌ Reputación — `/capacidades/reputacion/` (NO EXISTE)

Requiere crear desde cero:
- Entidad `Resena`, `CalificacionBarbero`, `CalificacionSucursal`
- Repositorios
- Casos de uso: `CrearResena`, `CalificarBarbero`, `CalificarSucursal`
- Endpoints: 5 nuevos
- Funciones almacenadas ya listas: `resena_crear`, `calificacion_barbero_registrar`, `calificacion_sucursal_registrar`

### ❌ Inventario — `/capacidades/inventario/` (NO EXISTE)

Requiere crear desde cero:
- Entidad `Producto`, `StockSucursal`, `MovimientoInventario`
- Repositorios
- Casos de uso: `CrearProducto`, `RegistrarMovimiento`, `ObtenerStock`
- Endpoints: 6 nuevos
- Funciones almacenadas ya listas: `movimiento_inventario_registrar`, `producto_crear`

### ❌ Campañas — `/capacidades/campanias/` (NO EXISTE)

Requiere crear desde cero:
- Entidad `Campana`, `ReglaAutomatizacion`, `DestinatarioCampana`
- Repositorios
- Casos de uso: `CrearCampana`, `ProgramarCampana`, `AgregarDestinatario`, `CrearReglaAutomatizacion`
- Endpoints: 7 nuevos
- Funciones almacenadas ya listas: `campana_crear`, `campana_programar`, `destinatario_campana_agregar`, `regla_automatizacion_crear`

### ❌ Integraciones — `/capacidades/integraciones/` (NO EXISTE)

Requiere crear desde cero:
- Entidad `TokenGoogleCalendar`, `EventoCalendar`
- Repositorios
- Casos de uso: `ConectarGoogleCalendar`, `RegistrarEventoCalendar`
- Funciones almacenadas ya listas: `evento_calendar_registrar`, `evento_calendar_actualizar_estado`

---

## Rutas HTTP — estado actual

### Rutas implementadas (70+)

```
POST   /api/auth/registrar                               ✅
POST   /api/auth/sesion                                  ✅
POST   /api/auth/cerrar-sesion                           ✅
POST   /api/usuarios/{usuarioID}/inactivar               ✅
POST   /api/usuarios/cambiar-password                    ✅

GET    /api/sucursales                                   ✅
GET    /api/sucursales/todas                             ✅
PATCH  /api/sucursales/{sucursalID}/estado               ✅
POST   /api/empresas                                     ✅
POST   /api/empresas/{empresaID}/sucursales              ✅
POST   /api/empresas/{empresaID}/periodos                ✅
GET    /api/periodos                                     ✅
POST   /api/periodos/{periodoID}/cerrar                  ✅

POST   /api/alcances                                     ✅
DELETE /api/alcances/{alcanceID}                         ✅
GET    /api/alcances                                     ✅
GET    /api/roles                                        ✅
GET    /api/usuarios                                     ✅

GET    /api/barberos                                     ✅
POST   /api/barberos                                     ✅
PATCH  /api/barberos/{barberoID}                         ✅
PATCH  /api/barberos/{barberoID}/estado                  ✅
POST   /api/barberos/{barberoID}/servicios               ✅
GET    /api/barberos/{barberoID}/servicios               ✅
DELETE /api/barberos/{barberoID}/servicios/{servicioID}  ✅
GET    /api/servicios                                    ✅
POST   /api/servicios                                    ✅
PATCH  /api/servicios/{servicioID}                       ✅
PATCH  /api/servicios/{servicioID}/estado                ✅
POST   /api/disponibilidad                               ✅
GET    /api/disponibilidad/{barberoID}                   ✅
GET    /api/agenda/slots                                 ✅

POST   /api/clientes                                     ✅
GET    /api/clientes                                     ✅
PATCH  /api/clientes/{clienteID}                         ✅
PATCH  /api/clientes/{clienteID}/estado                  ✅
GET    /api/reservas                                     ✅
POST   /api/reservas                                     ✅
PATCH  /api/reservas/{reservaID}                         ✅
POST   /api/reservas/{reservaID}/confirmar               ✅
POST   /api/reservas/{reservaID}/cancelar                ✅
POST   /api/reservas/{reservaID}/completar               ✅

POST   /api/conversaciones                               ✅
POST   /api/mensajes                                     ✅
POST   /api/sesiones-chat                                ✅
PATCH  /api/sesiones-chat/{sesionChatID}                 ✅

POST   /api/suscripciones                                ✅
POST   /api/suscripciones/{id}/suspender                 ✅
POST   /api/suscripciones/{id}/cancelar                  ✅
GET    /api/suscripciones                                ✅
GET    /api/planes                                       ✅

POST   /api/sellos                                       ✅
POST   /api/sellos/{selloID}/anular                      ✅
POST   /api/canjes                                       ✅
GET    /api/lealtad/programa                             ✅
GET    /api/lealtad/tarjetas                             ✅
GET    /api/lealtad/tarjetas/{clienteID}                 ✅
GET    /api/lealtad/clientes/{clienteID}/sellos          ✅

GET    /api/recordatorios                                ✅
POST   /api/recordatorios                                ✅
POST   /api/recordatorios/{recordatorioID}/cancelar      ✅
```

### Rutas faltantes (por implementar)

```
--- Identidad ---
POST   /api/auth/verificar-correo                        ❌ verificar email tras registro
POST   /api/auth/reenviar-verificacion                   ❌
POST   /api/auth/renovar-sesion                          ❌ refresh token

--- Organización ---
GET    /api/empresas/{empresaID}/configuracion           ❌
PATCH  /api/empresas/{empresaID}/configuracion           ❌

--- Agenda ---
POST   /api/barberos/{barberoID}/excepciones             ❌ excepcion_disponibilidad
GET    /api/barberos/{barberoID}/excepciones             ❌
POST   /api/agenda/tarifas-especiales                    ❌

--- Reservas ---
POST   /api/reservas/{reservaID}/no-asistio              ❌
POST   /api/reservas/{reservaID}/complementos            ❌
GET    /api/reservas/{reservaID}/complementos            ❌
POST   /api/lista-espera                                 ❌
GET    /api/lista-espera                                 ❌

--- Canal WhatsApp ---
POST   /api/whatsapp/sesion                              ❌ registrar sesión WA empresa
GET    /api/whatsapp/sesion                              ❌
POST   /api/indicaciones-bot                             ❌ CRUD indicaciones bot
GET    /api/indicaciones-bot                             ❌

--- Lealtad ---
POST   /api/lealtad/programa                             ❌ crear programa lealtad
PATCH  /api/lealtad/programa/{programaID}                ❌

--- Notificaciones ---
POST   /api/plantillas-mensaje                           ❌ crear plantilla
GET    /api/plantillas-mensaje                           ❌

--- Config negocio ---
POST   /api/comisiones/esquemas                          ❌ crear esquema comisión
GET    /api/comisiones/esquemas                          ❌

--- Comisiones (capacidad nueva) ---
POST   /api/comisiones/generar/{reservaID}               ❌
GET    /api/comisiones                                   ❌
POST   /api/liquidaciones/calcular                       ❌
POST   /api/liquidaciones/{id}/aprobar                   ❌
POST   /api/liquidaciones/{id}/pagar                     ❌
GET    /api/liquidaciones                                ❌

--- Reputación (capacidad nueva) ---
POST   /api/resenas                                      ❌
GET    /api/resenas                                      ❌
POST   /api/resenas/{id}/calificar-barbero               ❌
POST   /api/resenas/{id}/calificar-sucursal              ❌

--- Inventario (capacidad nueva) ---
POST   /api/productos                                    ❌
GET    /api/productos                                    ❌
POST   /api/inventario/movimientos                       ❌
GET    /api/inventario/stock                             ❌

--- Campañas (capacidad nueva) ---
POST   /api/campanias                                    ❌
GET    /api/campanias                                    ❌
POST   /api/campanias/{id}/programar                     ❌
POST   /api/campanias/{id}/destinatarios                 ❌
POST   /api/campanias/{id}/reglas                        ❌

--- Integraciones (capacidad nueva) ---
POST   /api/integraciones/google-calendar                ❌
DELETE /api/integraciones/google-calendar                ❌
```

---

## Problemas arquitecturales detectados

### 1. Manejadores con lógica directa al repositorio (viola 3DD)
Los siguientes handlers en `rutas.go` llaman directamente al repositorio **sin pasar por un caso de uso**:
- `PATCH /api/barberos/{id}` → llama `repoBarbero.ActualizarBarbero()` sin caso de uso
- `PATCH /api/barberos/{id}/estado` → llama `repoBarbero.ActualizarEstadoBarbero()` sin caso de uso
- `PATCH /api/servicios/{id}` → llama `repoServicio.ActualizarServicio()` sin caso de uso
- `PATCH /api/servicios/{id}/estado` → llama `repoServicio.ActualizarEstadoServicio()` sin caso de uso
- `PATCH /api/clientes/{id}` → llama `repoCliente.ActualizarCliente()` sin caso de uso
- `PATCH /api/clientes/{id}/estado` → llama `repoCliente.ActualizarEstadoCliente()` sin caso de uso
- `PATCH /api/sucursales/{id}/estado` → llama `repoSucursal.ActualizarEstadoSucursal()` sin caso de uso
- `POST /api/periodos/{id}/cerrar` → llama `repoPeriodo.Cerrar()` sin caso de uso (falta orquestar eventos + auditoría)

**Impacto:** No se publican eventos, no se registra auditoría correctamente, no se aplican políticas de dominio.

### 2. GuardiaPoliticas definida pero no integrada
`/aplicacion/orquestacion/guardia_politicas.go` tiene `PuedeEjecutar()` que verifica permisos, pero los handlers no lo invocan. Solo `ValidarSesion` middleware verifica JWT.

### 3. Publicador de eventos solo hace logging
`NuevoPublicadorLog()` escribe a stdout. No hay integración con ningún message broker (Redis Streams, NATS, etc.).

### 4. Worker de notificaciones inexistente
`recordatorio_programado` acumula registros pero no hay goroutine/cron que los procese y los envíe vía WhatsApp o email.

### 5. `control_por_plan.go` incompleto
Solo verifica si hay suscripción activa. No valida los límites del plan (`MAX_BARBEROS`, `MAX_SUCURSALES`, etc.) contra `plan_limite`.

### 6. Refresh token sin flujo
La columna `refresh_token_hash` existe y se guarda, pero no hay endpoint `/api/auth/renovar-sesion`.

---

## Contratos entre capacidades (interfaces locales)

| Contrato | Ubicación | Implementado por | Consumido por |
|----------|-----------|-----------------|--------------|
| `ConsultorRol` | `identidad/casos_uso/iniciar_sesion_global.go` | `RepositorioAlcanceCockroach` | `CasoUsoIniciarSesionGlobal` |
| `VerificadorIdentidad` | `identidad/contratos/verificador.go` | `AdaptadorVerificadorIdentidad` | `AsignarAlcance`, `AtenderChat` |
| `ValidadorPermiso` | `gobierno_acceso/contratos/validador_permiso.go` | `AdaptadorValidadorPermiso` | `AsignarAlcance`, `RevocarAlcance` |
| `GestorDisponibilidad` | `agenda/contratos/gestor_disponibilidad.go` | `AdaptadorGestorDisponibilidad` | `RegistrarReserva`, `CancelarReserva` |
| `ConsultorDisponibilidad` | `agenda/contratos/consultador_disponibilidad.go` | `AdaptadorConsultorDisponibilidad` | `AtenderChat` |
| `ConsultorSede` | `organizacion/contratos/consultor_sede.go` | `AdaptadorConsultorSede` | `RegistrarReserva`, `AtenderChat` |
| `CreadorReserva` | `reservas/contratos/creador_reserva.go` | `AdaptadorCreadorReserva` | `AtenderChat` |

---

## Prioridad de implementación — Hoja de ruta

### Fase inmediata (gaps críticos en flujo existente)
1. `GuardarConfiguracionEmpresa` — configuracion_empresa
2. `CrearProgramaLealtad` — sin esto el programa lealtad asume datos en DB
3. `VerificarCorreo` + `CrearVerificacion` — flujo de registro completo
4. Convertir handlers con lógica directa → casos de uso completos (auditoría + eventos)
5. `GuardiaPoliticas` integrado a handlers

### Fase media (funcionalidades de negocio)
6. `RegistrarExcepcionDisponibilidad`
7. `MarcarNoAsistio`
8. `ComisionesCapacidad` — esquema + generar + liquidar
9. `ReputacionCapacidad` — reseñas + calificaciones
10. `CrearPlantillaMensaje` + CRUD indicaciones bot
11. Worker de notificaciones (cron para `recordatorio_programado`)

### Fase avanzada (capacidades nuevas)
12. `InventarioCapacidad` — productos + stock + movimientos
13. `CampaniasCapacidad` — marketing + automatización
14. `IntegracionesCapacidad` — Google Calendar
15. Validación de límites de plan (`plan_limite`)
16. Publicador real de eventos (Redis Streams / NATS)
17. Refresh token
