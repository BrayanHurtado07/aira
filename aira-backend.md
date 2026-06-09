# AIRA — Estado Backend Go
> Inventario completo de casos de uso, repositorios, rutas HTTP y brechas de implementación.
> Actualizado: 2026-06-09

---

## Arquitectura general

```
HTTP (Chi)
  └── rutas.go (78+ endpoints)
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

## Casos de uso implementados (~38)

### Identidad — `/capacidades/identidad/casos_uso/` ✅ COMPLETO

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| RegistrarUsuario | `registrar_usuario.go` | `usuario_registrar` | UsuarioRegistrado | ✅ |
| IniciarSesionGlobal | `iniciar_sesion_global.go` | `usuario_iniciar_sesion` | SesionIniciada | ✅ + ObtenerNombreRol |
| CerrarSesion | `cerrar_sesion.go` | `usuario_cerrar_sesion` | SesionRevocada | ✅ |
| InactivarUsuario | `inactivar_usuario.go` | — (UPDATE directo) | UsuarioInactivado | ✅ |
| CambiarPassword | `cambiar_password.go` | — (UPDATE directo) | PasswordCambiado | ✅ |
| **RefrescarSesion** | `refrescar_sesion.go` | `usuario_refrescar_sesion` | — | ✅ **NUEVO** |
| **VerificarCorreo** | `verificar_correo.go` | `usuario_verificar_correo` | — | ✅ **NUEVO** |
| **SolicitarVerificacionCorreo** | `solicitar_verificacion_correo.go` | `verificacion_correo_crear` | — | ✅ **NUEVO** |
| **SolicitarRestablecimientoPassword** | `solicitar_restablecimiento_password.go` | — | — | ✅ **NUEVO** |
| **RestablecerPassword** | `restablecer_password.go` | — | — | ✅ **NUEVO** |

**Pendiente:**
- Integrar envío real de email (SMTP/SendGrid) en `SolicitarVerificacionCorreo` y `SolicitarRestablecimientoPassword`

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

### Agenda — `/capacidades/agenda/casos_uso/` ✅ EXPANDIDO

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| RegistrarBarbero | `registrar_barbero.go` | `barbero_registrar` | BarberoRegistrado | ✅ |
| CrearServicio | `crear_servicio.go` | `servicio_crear` | ServicioRegistrado | ✅ |
| RegistrarDisponibilidad | `registrar_disponibilidad.go` | `disponibilidad_registrar` | DisponibilidadCreada | ✅ |
| AsignarServicioBarbero | `asignar_servicio_barbero.go` | `barbero_servicio_asignar` | — | ✅ |
| **RegistrarExcepcionDisponibilidad** | `registrar_excepcion_disponibilidad.go` | `excepcion_disponibilidad_registrar` | — | ✅ **NUEVO** |
| **CrearTarifaEspecial** | — | `tarifa_especial_crear` | — | ⚠️ repo listo, caso de uso pendiente |

**Handler directo al repo (viola 3DD):**
- `PATCH /api/barberos/{id}` → llama `repoBarbero.ActualizarBarbero()` sin caso de uso
- `PATCH /api/barberos/{id}/estado` → llama `repoBarbero.ActualizarEstadoBarbero()` sin caso de uso
- `PATCH /api/servicios/{id}` → llama `repoServicio.ActualizarServicio()` sin caso de uso
- `PATCH /api/servicios/{id}/estado` → llama `repoServicio.ActualizarEstadoServicio()` sin caso de uso

### Reservas — `/capacidades/reservas/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Evento publicado | Estado |
|-------------|---------|-------------------|-----------------|--------|
| RegistrarCliente | `registrar_cliente.go` | `cliente_registrar` | — | ✅ |
| RegistrarReserva | `registrar_reserva.go` | `reserva_crear` | ReservaCreada | ✅ |
| ConfirmarReserva | `confirmar_reserva.go` | `reserva_confirmar` | ReservaConfirmada | ✅ |
| CancelarReserva | `cancelar_reserva.go` | `reserva_cancelar` | ReservaCancelada | ✅ |
| CompletarReserva | `completar_reserva.go` | `reserva_completar` | ReservaCompletada | ✅ |

**Falta:**
- `AgregarComplementoReserva` — función BD lista — **sin implementar**
- `IngresarListaEspera` — repo + entidad listos — **sin caso de uso**
- `MarcarNoAsistio` — estado `NO_ASISTIO` existe en DB, sin caso de uso ni endpoint

**Handler directo al repo (viola 3DD):**
- `PATCH /api/clientes/{id}` → sin caso de uso
- `PATCH /api/clientes/{id}/estado` → sin caso de uso

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
- Lógica real del bot Serbio/Luna IA

### Monetización — `/capacidades/monetizacion/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Estado |
|-------------|---------|-------------------|--------|
| ActivarSuscripcion | `activar_suscripcion.go` | `suscripcion_activar` | ✅ |
| SuspenderSuscripcion | `suspender_suscripcion.go` | `suscripcion_suspender` | ✅ |
| CancelarSuscripcion | `cancelar_suscripcion.go` | `suscripcion_cancelar` | ✅ |

**Falta:**
- Validación de `plan_limite` — `control_por_plan.go` solo verifica existencia de suscripción activa

### Lealtad — `/capacidades/lealtad/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Estado |
|-------------|---------|-------------------|--------|
| AcumularSello | `acumular_sello.go` | `sello_acumular` | ✅ |
| AnularSello | `anular_sello.go` | `sello_anular` | ✅ |
| AplicarCanje | `aplicar_canje.go` | `canje_recompensa_aplicar` | ✅ |

**Falta:**
- `CrearProgramaLealtad` — repo listo en `lealtad/programas/`, falta caso de uso
- `ActualizarProgramaLealtad` — sin implementar

### Notificaciones — `/capacidades/notificaciones/casos_uso/`

| Caso de uso | Archivo | Función almacenada | Estado |
|-------------|---------|-------------------|--------|
| ProgramarRecordatorio | `programar_recordatorio.go` | `recordatorio_programar` | ✅ |
| CancelarRecordatorio | `cancelar_recordatorio.go` | `recordatorio_cancelar` | ✅ |

**Falta:**
- `CrearPlantillaMensaje` — función BD lista, sin caso de uso
- Worker de envío — nadie despacha `recordatorio_programado`

### Tablero — `/capacidades/tablero/` ✅ NUEVO

| Caso de uso | Archivo | Estado |
|-------------|---------|--------|
| ObtenerMetricasTablero | `casos_uso/obtener_metricas.go` | ✅ |

- Repositorio propio (`repositorio.go`) con queries de métricas
- Entidades en `metricas.go`
- Ruta: `GET /api/tablero/metricas`

### Inventario — `/capacidades/inventario/` ⚠️ PARCIAL (NUEVO)

| Caso de uso | Archivo | Función almacenada | Estado |
|-------------|---------|-------------------|--------|
| **CrearProducto** | `casos_uso/crear_producto.go` | `producto_crear` | ✅ **NUEVO** |
| **RegistrarMovimientoInventario** | `casos_uso/registrar_movimiento_inventario.go` | `movimiento_inventario_registrar` | ✅ **NUEVO** |

**Falta:**
- Caso de uso `ObtenerStock` — sin implementar
- `GET /api/productos` — sin ruta
- `GET /api/inventario/stock` — sin ruta

---

## Capacidades completamente ausentes en Go (4)

### ❌ Comisiones
- Entidades: `EsquemaComision`, `Liquidacion`, `Comision`
- Casos de uso requeridos: `CrearEsquemaComision`, `GenerarComision`, `CalcularLiquidacion`, `AprobarLiquidacion`, `PagarLiquidacion`
- Funciones BD ya listas: `esquema_comision_crear`, `comision_generar`, `liquidacion_calcular`, `liquidacion_aprobar`, `liquidacion_pagar`

### ❌ Reputación
- Entidades: `Resena`, `CalificacionBarbero`, `CalificacionSucursal`
- Casos de uso requeridos: `CrearResena`, `CalificarBarbero`, `CalificarSucursal`
- Funciones BD ya listas: `resena_crear`, `calificacion_barbero_registrar`, `calificacion_sucursal_registrar`

### ❌ Campañas
- Entidades: `Campana`, `ReglaAutomatizacion`, `DestinatarioCampana`
- Casos de uso requeridos: `CrearCampana`, `ProgramarCampana`, `AgregarDestinatario`, `CrearReglaAutomatizacion`
- Funciones BD ya listas: `campana_crear`, `campana_programar`, `destinatario_campana_agregar`, `regla_automatizacion_crear`

### ❌ Integraciones
- Entidades: `TokenGoogleCalendar`, `EventoCalendar`
- Casos de uso requeridos: `ConectarGoogleCalendar`, `RegistrarEventoCalendar`
- Funciones BD ya listas: `evento_calendar_registrar`, `evento_calendar_actualizar_estado`

---

## Rutas HTTP — estado actual

### Rutas implementadas (78+)

```
--- Identidad ---
POST   /api/auth/registrar                               ✅
POST   /api/auth/sesion                                  ✅
POST   /api/auth/cerrar-sesion                           ✅
POST   /api/auth/renovar-sesion                          ✅ NUEVO (RefrescarSesion)
POST   /api/auth/verificar-correo                        ✅ NUEVO
POST   /api/auth/solicitar-verificacion                  ✅ NUEVO
POST   /api/auth/solicitar-reset                         ✅ NUEVO
POST   /api/auth/restablecer-password                    ✅ NUEVO
POST   /api/usuarios/{usuarioID}/inactivar               ✅
POST   /api/usuarios/cambiar-password                    ✅

--- Organización ---
GET    /api/sucursales                                   ✅
GET    /api/sucursales/todas                             ✅
PATCH  /api/sucursales/{sucursalID}/estado               ✅
POST   /api/empresas                                     ✅
POST   /api/empresas/{empresaID}/sucursales              ✅
POST   /api/empresas/{empresaID}/periodos                ✅
GET    /api/periodos                                     ✅
POST   /api/periodos/{periodoID}/cerrar                  ✅

--- Gobierno de Acceso ---
POST   /api/alcances                                     ✅
DELETE /api/alcances/{alcanceID}                         ✅
GET    /api/alcances                                     ✅
GET    /api/roles                                        ✅
GET    /api/usuarios                                     ✅

--- Agenda ---
GET    /api/barberos                                     ✅
POST   /api/barberos                                     ✅
PATCH  /api/barberos/{barberoID}                         ✅ (⚠️ handler directo al repo)
PATCH  /api/barberos/{barberoID}/estado                  ✅ (⚠️ handler directo al repo)
POST   /api/barberos/{barberoID}/servicios               ✅
GET    /api/barberos/{barberoID}/servicios               ✅
DELETE /api/barberos/{barberoID}/servicios/{servicioID}  ✅
POST   /api/barberos/{barberoID}/excepciones             ✅ NUEVO
GET    /api/barberos/{barberoID}/excepciones             ✅ NUEVO
DELETE /api/barberos/{barberoID}/excepciones/{id}        ✅ NUEVO
GET    /api/servicios                                    ✅
POST   /api/servicios                                    ✅
PATCH  /api/servicios/{servicioID}                       ✅ (⚠️ handler directo al repo)
PATCH  /api/servicios/{servicioID}/estado                ✅ (⚠️ handler directo al repo)
POST   /api/disponibilidad                               ✅
GET    /api/disponibilidad/{barberoID}                   ✅
GET    /api/agenda/slots                                 ✅

--- Reservas ---
POST   /api/clientes                                     ✅
GET    /api/clientes                                     ✅
PATCH  /api/clientes/{clienteID}                         ✅ (⚠️ handler directo al repo)
PATCH  /api/clientes/{clienteID}/estado                  ✅ (⚠️ handler directo al repo)
GET    /api/reservas                                     ✅
POST   /api/reservas                                     ✅
PATCH  /api/reservas/{reservaID}                         ✅
POST   /api/reservas/{reservaID}/confirmar               ✅
POST   /api/reservas/{reservaID}/cancelar                ✅
POST   /api/reservas/{reservaID}/completar               ✅

--- Canal WhatsApp ---
POST   /api/conversaciones                               ✅
POST   /api/mensajes                                     ✅
POST   /api/sesiones-chat                                ✅
PATCH  /api/sesiones-chat/{sesionChatID}                 ✅

--- Monetización ---
POST   /api/suscripciones                                ✅
POST   /api/suscripciones/{id}/suspender                 ✅
POST   /api/suscripciones/{id}/cancelar                  ✅
GET    /api/suscripciones                                ✅
GET    /api/planes                                       ✅

--- Lealtad ---
POST   /api/sellos                                       ✅
POST   /api/sellos/{selloID}/anular                      ✅
POST   /api/canjes                                       ✅
GET    /api/lealtad/programa                             ✅
GET    /api/lealtad/tarjetas                             ✅
GET    /api/lealtad/tarjetas/{clienteID}                 ✅
GET    /api/lealtad/clientes/{clienteID}/sellos          ✅

--- Notificaciones ---
GET    /api/recordatorios                                ✅
POST   /api/recordatorios                                ✅
POST   /api/recordatorios/{recordatorioID}/cancelar      ✅

--- Tablero ---
GET    /api/tablero/metricas                             ✅ NUEVO

--- Inventario (parcial) ---
POST   /api/inventario/movimientos                       ✅ NUEVO
```

### Rutas faltantes (por implementar)

```
--- Organización ---
GET    /api/empresas/{empresaID}/configuracion           ❌
PATCH  /api/empresas/{empresaID}/configuracion           ❌

--- Agenda ---
POST   /api/agenda/tarifas-especiales                    ❌

--- Reservas ---
POST   /api/reservas/{reservaID}/no-asistio              ❌
POST   /api/reservas/{reservaID}/complementos            ❌
GET    /api/reservas/{reservaID}/complementos            ❌
POST   /api/lista-espera                                 ❌
GET    /api/lista-espera                                 ❌

--- Canal WhatsApp ---
POST   /api/whatsapp/sesion                              ❌
GET    /api/whatsapp/sesion                              ❌
POST   /api/indicaciones-bot                             ❌
GET    /api/indicaciones-bot                             ❌

--- Lealtad ---
POST   /api/lealtad/programa                             ❌
PATCH  /api/lealtad/programa/{programaID}                ❌

--- Notificaciones ---
POST   /api/plantillas-mensaje                           ❌
GET    /api/plantillas-mensaje                           ❌

--- Inventario (completar) ---
POST   /api/productos                                    ❌ (caso de uso existe, falta ruta)
GET    /api/productos                                    ❌
GET    /api/inventario/stock                             ❌

--- Rutas PÚBLICAS (sin JWT) para reserva-publica frontend ---
GET    /api/publica/slots                                ❌ CRÍTICO — el wizard frontend no funciona sin esto
POST   /api/publica/reservas                             ❌ CRÍTICO
GET    /api/publica/servicios                            ❌
GET    /api/publica/barberos                             ❌

--- Comisiones (capacidad nueva) ---
POST   /api/comisiones/esquemas                          ❌
GET    /api/comisiones/esquemas                          ❌
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

## Problemas arquitecturales

### 1. Manejadores con lógica directa al repositorio (viola 3DD)
8 handlers llaman directamente al repositorio sin pasar por un caso de uso:
- `PATCH /api/barberos/{id}` y `/estado`
- `PATCH /api/servicios/{id}` y `/estado`
- `PATCH /api/clientes/{id}` y `/estado`
- `PATCH /api/sucursales/{id}/estado`
- `POST /api/periodos/{id}/cerrar`

**Impacto:** No se publican eventos, no se registra auditoría, no se aplican políticas de dominio.

### 2. GuardiaPoliticas definida pero no integrada
`/aplicacion/orquestacion/guardia_politicas.go` tiene `PuedeEjecutar()` que verifica permisos, pero los handlers no lo invocan. Solo `ValidarSesion` middleware verifica JWT. **Riesgo: cualquier usuario autenticado accede a cualquier endpoint.**

### 3. Publicador de eventos solo hace logging
`NuevoPublicadorLog()` escribe a stdout. No hay integración con ningún message broker.

### 4. Worker de notificaciones inexistente
`recordatorio_programado` acumula registros pero no hay goroutine/cron que los procese.

### 5. `control_por_plan.go` incompleto
Solo verifica si hay suscripción activa. No valida los límites del plan contra `plan_limite`.

### 6. Rutas públicas para reserva-publica inexistentes
El frontend tiene un wizard completo en `/reserva/:sucursalSlug` pero no existen endpoints públicos (sin JWT) para servirlo.

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

## Prioridad de implementación

### Fase crítica (bloquean seguridad o flujo base)
1. Rutas públicas `/api/publica/*` — sin esto PaginaReservaPublica no funciona
2. `GuardiaPoliticas` integrada a handlers de escritura
3. `CrearProgramaLealtad` — repo listo
4. `GuardarConfiguracionEmpresa` — repo y función BD listas

### Fase media (funcionalidades de negocio)
5. `IngresarListaEspera` — repo listo
6. `MarcarNoAsistio`
7. Convertir 8 handlers directos → casos de uso
8. `ComisionesCapacidad`
9. `ReputacionCapacidad`
10. `CrearPlantillaMensaje` + CRUD indicaciones bot
11. Worker de notificaciones

### Fase avanzada (capacidades nuevas)
12. Completar `InventarioCapacidad` (GET endpoints)
13. `CampaniasCapacidad`
14. `IntegracionesCapacidad`
15. Validación límites de plan
16. Publicador real de eventos
