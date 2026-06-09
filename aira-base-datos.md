# AIRA — Estado Base de Datos
> Inventario completo de tablas, funciones almacenadas y su conexión con el backend Go.
> Actualizado: 2026-06-09

---

## Resumen ejecutivo

| Módulo | Tablas | Funciones | Repo Go | Casos de uso Go |
|--------|--------|-----------|---------|-----------------|
| Identidad | 3 | 5 | ✅ | ✅ (10/10) — incluye verificación + refresh + reset |
| Organización | 4 | 4 | ✅ | ✅ (4/4) — falta GuardarConfiguracion |
| Gobierno de Acceso | 5 | 2 | ✅ | ✅ (2/2) |
| Monetización | 3 | 3 | ✅ | ✅ (3/3) |
| Agenda | 6 | 5 | ✅ | ✅ (6/6) — excepciones implementadas; falta tarifa |
| Reservas | 5 | 7 | ✅ | ✅ (5/5) — lista_espera repo listo, falta caso de uso |
| Canal WhatsApp | 5 | 4 | ✅ | ✅ (4/4) |
| Lealtad | 4 | 3 | ✅ | ✅ (3/3) — repo programa listo, falta caso de uso crear |
| Notificaciones | 3 | 2 | ✅ | ✅ (2/2) |
| Tablero | — | queries propias | ✅ | ✅ (1/1) NUEVO |
| **Inventario** | **3** | **2** | ✅ NUEVO | ✅ (2/3) — falta ObtenerStock |
| **Comisiones** | **3** | **5** | ❌ | ❌ (0/5) |
| **Reputación** | **3** | **3** | ❌ | ❌ (0/3) |
| **Campañas** | **4** | **4** | ❌ | ❌ (0/4) |
| **Integraciones** | **2** | **2** | ❌ | ❌ (0/2) |
| **Config. negocio** | **1** | **5** | ❌ | ❌ (0/5) |
| **TOTAL** | **54** | **56** | ~12 repos | ~38 casos de uso |

> ✅ = implementado · ❌ = no implementado · ⚠️ = parcial

---

## DDL — Todas las tablas

### 01_identidad.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `usuario` | id_usuario, correo_electronico (UNIQUE), contrasena_hash, nombre, telefono, correo_verificado, estado (ACTIVO\|INACTIVO\|ELIMINADO\|BLOQUEADO) | ✅ Repo + 10 casos de uso |
| `sesion_global` | id_sesion_global, id_usuario, token_hash (UNIQUE), refresh_token_hash, ip_origen, user_agent, expira_en, estado (ACTIVA\|EXPIRADA\|REVOCADA) | ✅ Repo + RefrescarSesion implementado |
| `verificacion_correo_electronico` | id_verificacion, id_usuario, codigo_hash, expira_en, usado | ✅ Repo en `verificaciones/repositorio.go` + casos de uso NUEVO |

### 02_organizacion.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `empresa` | id_empresa, nombre, pais (PE\|AR\|CO\|CL\|EC\|BO), moneda, frecuencia_liquidacion, estado | ✅ |
| `sucursal` | id_sucursal, id_empresa, nombre, direccion, zona_horaria, telefono, estado | ✅ |
| `periodo` | id_periodo, id_empresa, nombre, fecha_inicio, fecha_fin, estado (ACTIVO\|CERRADO\|ELIMINADO) | ✅ |
| `configuracion_empresa` | id_configuracion, id_empresa (UNIQUE), horas_anticipacion_cancelacion, dias_max_reserva_anticipada, horas_recordatorio_reserva, permite_reserva_mismo_dia, requiere_confirmacion_manual | ⚠️ Función `configuracion_empresa_guardar` existe — **sin repo ni caso de uso Go** |

### 03_gobierno_acceso.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `rol` | id_rol, nombre (UNIQUE), descripcion, estado | ✅ (solo lectura) |
| `permiso` | id_permiso, codigo (UNIQUE), descripcion, capacidad, estado | ✅ (solo lectura) |
| `rol_permiso` | id_rol, id_permiso (PK compuesto) | ✅ (lectura vía JOIN) |
| `alcance` | id_alcance, id_usuario, id_empresa, id_sucursal?, id_rol, estado (ACTIVO\|INACTIVO\|ELIMINADO) | ✅ |
| `auditoria_accion` | id_auditoria, id_usuario?, id_empresa?, entidad, entidad_id, accion, detalle_json, ip_origen, realizado_en | ✅ (escritura en casos de uso con caso de uso, ⚠️ ausente en handlers directos al repo) |

### 04_monetizacion.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `plan` | id_plan, nombre (BASICO\|PRO\|ENTERPRISE), precio_mensual, moneda_plan, estado | ✅ (solo lectura) |
| `plan_limite` | id_plan_limite, id_plan, concepto (MAX_SUCURSALES\|MAX_BARBEROS\|etc), valor | ⚠️ Sin implementación de límites en Go — `control_por_plan.go` no lo consulta |
| `suscripcion` | id_suscripcion, id_empresa, id_plan, fecha_inicio, fecha_renovacion, estado (ACTIVA\|SUSPENDIDA\|CANCELADA\|VENCIDA) | ✅ |

### 05_agenda.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `barbero` | id_barbero, id_empresa, id_usuario?, nombre, telefono, foto_url, estado | ✅ |
| `servicio` | id_servicio, id_empresa, nombre, duracion_minutos, precio_base, descripcion, estado | ✅ |
| `barbero_servicio` | id_barbero, id_servicio (PK compuesto) | ✅ |
| `disponibilidad` | id_disponibilidad, id_barbero, id_sucursal, dia_semana (0-6), hora_inicio, hora_fin, estado | ✅ |
| `excepcion_disponibilidad` | id_excepcion, id_barbero, id_sucursal, fecha, motivo (FERIADO\|VACACION\|CIERRE\|OTRO), descripcion | ✅ Repo + caso de uso NUEVO |
| `tarifa_especial` | id_tarifa, id_sucursal, id_servicio, fecha, precio_especial, motivo | ⚠️ Repo listo — **falta caso de uso y endpoint** |

### 06_inventario_base.sql ⚠️ PARCIALMENTE IMPLEMENTADO

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `producto` | id_producto, id_empresa, nombre, codigo (UNIQUE por empresa), tipo (INSUMO_BARBERO\|CONSUMIBLE_CLIENTE), precio_unitario, estado | ✅ Repo + caso de uso CrearProducto NUEVO |
| `stock_sucursal` | id_stock, id_producto, id_sucursal (UNIQUE compuesto), cantidad_actual, cantidad_minima | ⚠️ Repo existe, falta caso de uso ObtenerStock y endpoint GET |
| `consumo_servicio` | id_servicio, id_producto (PK compuesto), cantidad_estimada | ❌ Sin repo ni caso de uso |

### 07_notificaciones_plantilla.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `plantilla_mensaje` | id_plantilla, id_empresa, nombre, canal (WHATSAPP\|EMAIL), contenido_plantilla, variables_json, estado | ⚠️ Función `plantilla_mensaje_crear` existe — **sin caso de uso Go** |

### 08_canal_whatsapp.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `sesion_whatsapp_empresa` | id_sesion_wa, id_empresa, numero_telefono, token_acceso_cifrado, proveedor (META_CLOUD\|TWILIO\|BAILEYS), estado | ⚠️ Sin repo ni caso de uso |
| `conversacion` | id_conversacion, id_empresa, id_cliente?, numero_cliente_wa, estado (ACTIVA\|CERRADA\|EXPIRADA) | ✅ |
| `mensaje` | id_mensaje, id_conversacion, contenido, tipo (TEXTO\|IMAGEN\|AUDIO\|etc), direccion (ENTRADA\|SALIDA), id_externo_wa, estado_entrega | ✅ |
| `sesion_chat` | id_sesion_chat, id_conversacion (UNIQUE), paso_actual, contexto_json, expira_en | ✅ |
| `indicacion_bot` | id_indicacion, id_empresa, nombre, tipo (SALUDO\|MENU_PRINCIPAL\|etc), contenido, activa | ⚠️ Sin repo ni caso de uso |

### 09_reservas.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `cliente` | id_cliente, id_empresa, nombre, telefono (UNIQUE por empresa), correo_electronico?, fecha_nacimiento?, estado | ✅ |
| `reserva` | id_reserva, id_empresa, id_cliente, id_barbero, id_sucursal, id_periodo, fecha_hora_inicio, fecha_hora_fin, estado (PENDIENTE\|CONFIRMADA\|COMPLETADA\|CANCELADA\|NO_ASISTIO), origen (WHATSAPP\|WEB\|MANUAL) | ✅ |
| `reserva_servicio` | id_reserva, id_servicio (PK compuesto), precio_acordado | ✅ (vía stored proc) |
| `complemento_reserva` | id_reserva, id_producto (PK compuesto), cantidad | ⚠️ Función `complemento_reserva_agregar` existe — **sin caso de uso Go** |
| `lista_espera` | id_lista_espera, id_empresa, id_cliente, id_sucursal, id_servicio, id_barbero?, fecha_hora_deseada, estado (ESPERANDO\|NOTIFICADO\|EXPIRADO\|ATENDIDO) | ⚠️ Repo listo en `reservas/lista_espera/` — **falta caso de uso** |

### 10_campanias.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `campana` | id_campana, id_empresa, id_plantilla_mensaje, nombre, tipo (MANUAL\|AUTOMATICA), estado, programada_para | ❌ |
| `regla_automatizacion` | id_regla, id_campana, condicion (CUMPLEANIOS\|INACTIVIDAD_30_DIAS\|SELLO_ACUMULADO\|RESERVA_COMPLETADA), parametros_json, activa | ❌ |
| `destinatario_campana` | id_campana, id_cliente (PK compuesto) | ❌ |
| `log_envio_campana` | id_log_envio, id_campana, id_cliente, resultado, enviado_en, error_descripcion | ❌ |

### 11_comisiones.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `esquema_comision` | id_esquema, id_empresa, nombre, tipo (PORCENTAJE\|FIJO\|MIXTO), sueldo_base, porcentaje_por_servicio, estado | ❌ |
| `liquidacion` | id_liquidacion, id_barbero, id_empresa, fecha_inicio, fecha_fin, monto_total, frecuencia, estado (CALCULADA\|APROBADA\|PAGADA) | ❌ |
| `comision` | id_comision, id_barbero, id_reserva (UNIQUE), id_esquema_comision, id_liquidacion?, monto_calculado, estado (PENDIENTE\|INCLUIDA_EN_LIQUIDACION\|ANULADA) | ❌ |

### 12_lealtad.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `programa_lealtad` | id_programa, id_empresa, nombre, sellos_para_recompensa, descripcion_recompensa, estado | ⚠️ Repo en `lealtad/programas/repositorio.go` — **falta caso de uso CrearProgramaLealtad** |
| `tarjeta_lealtad` | id_tarjeta, id_programa, id_cliente (UNIQUE compuesto), estado (ACTIVA\|SUSPENDIDA\|ELIMINADA) | ✅ (creación automática vía sello_acumular; entidad en `lealtad/tarjetas/tarjeta.go`) |
| `sello` | id_sello, id_tarjeta_lealtad, id_reserva (UNIQUE), estado (VALIDO\|ANULADO), acumulado_en | ✅ |
| `canje_recompensa` | id_canje, id_tarjeta_lealtad, id_reserva, sellos_utilizados, descripcion_recompensa_aplicada, estado (APLICADO\|REVERTIDO) | ✅ |

### 13_reputacion.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `resena` | id_resena, id_reserva (UNIQUE), id_cliente, id_empresa, estado (PENDIENTE\|PUBLICADA\|MODERADA\|ELIMINADA) | ❌ |
| `calificacion_barbero` | id_calificacion_barbero, id_resena, id_barbero, puntaje (1-5), comentario | ❌ |
| `calificacion_sucursal` | id_calificacion_sucursal, id_resena, id_sucursal, puntaje (1-5), comentario | ❌ |

### 14_notificaciones_resto.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `recordatorio_programado` | id_recordatorio, id_reserva, enviar_en, canal (WHATSAPP\|EMAIL), estado (PENDIENTE\|ENVIADO\|FALLIDO\|CANCELADO) | ✅ |
| `log_notificacion` | id_log_notificacion, id_recordatorio, resultado (ENVIADO\|FALLIDO), enviado_en, error_descripcion | ⚠️ Sin repo — solo se escribe vía stored proc interno |

### 15_inventario_movimientos.sql ⚠️ PARCIALMENTE IMPLEMENTADO

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `movimiento_inventario` | id_movimiento, id_producto, id_sucursal, id_reserva?, tipo_movimiento (COMPRA\|CONSUMO_SERVICIO\|CONSUMO_COMPLEMENTO\|AJUSTE\|DEVOLUCION), cantidad, causa_descripcion, registrado_por | ✅ Repo + caso de uso RegistrarMovimientoInventario NUEVO |

### 16_integraciones.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `token_google_calendar` | id_token, id_empresa (UNIQUE), access_token_cifrado, refresh_token_cifrado, expira_en, correo_propietario, estado (ACTIVO\|REVOCADO) | ❌ |
| `evento_calendar` | id_evento_calendar, id_reserva (UNIQUE), id_empresa, id_google_event, estado (PENDIENTE\|CREADO\|ACTUALIZADO\|ELIMINADO) | ❌ |

---

## Funciones almacenadas — inventario completo

### Funciones implementadas en Go (~35 de 56)

| Función | Módulo | Llamada desde |
|---------|--------|---------------|
| `usuario_registrar` | Identidad | `RepositorioUsuarioCockroach.Guardar` |
| `usuario_iniciar_sesion` | Identidad | `RepositorioSesionCockroach.Guardar` |
| `usuario_cerrar_sesion` | Identidad | `RepositorioSesionCockroach.Revocar` |
| `usuario_verificar_correo` | Identidad | `RepositorioVerificacionCockroach` **NUEVO** |
| `verificacion_correo_crear` | Identidad | `RepositorioVerificacionCockroach` **NUEVO** |
| `empresa_crear` | Organización | `RepositorioEmpresaCockroach.Guardar` |
| `sucursal_crear` | Organización | `RepositorioSucursalCockroach.Guardar` |
| `periodo_crear` | Organización | `RepositorioPeriodoCockroach.Guardar` |
| `alcance_asignar` | Gobierno de Acceso | `RepositorioAlcanceCockroach.Asignar` |
| `alcance_revocar` | Gobierno de Acceso | `RepositorioAlcanceCockroach.Revocar` |
| `barbero_registrar` | Agenda | `RepositorioBarberosCockroach.Guardar` |
| `barbero_servicio_asignar` | Agenda | `RepositorioBarberosCockroach.AsignarServicio` |
| `servicio_crear` | Agenda | `RepositorioServicioCockroach.Guardar` |
| `disponibilidad_registrar` | Agenda | `RepositorioDisponibilidadCockroach.Registrar` |
| `disponibilidad_marcar_reservada` | Agenda | `RepositorioDisponibilidadCockroach.MarcarReservada` |
| `disponibilidad_liberar` | Agenda | `RepositorioDisponibilidadCockroach.LiberarBloque` |
| `excepcion_disponibilidad_registrar` | Agenda | `RepositorioExcepcionCockroach.Registrar` **NUEVO** |
| `cliente_registrar` | Reservas | `RepositorioClienteCockroach.Guardar` |
| `reserva_crear` | Reservas | `RepositorioReservaCockroach.Guardar` |
| `reserva_confirmar` | Reservas | `RepositorioReservaCockroach.Confirmar` |
| `reserva_cancelar` | Reservas | `RepositorioReservaCockroach.Cancelar` |
| `reserva_completar` | Reservas | `RepositorioReservaCockroach.Completar` |
| `suscripcion_activar` | Monetización | `RepositorioSuscripcionCockroach.Activar` |
| `suscripcion_suspender` | Monetización | `RepositorioSuscripcionCockroach.Suspender` |
| `suscripcion_cancelar` | Monetización | `RepositorioSuscripcionCockroach.Cancelar` |
| `sello_acumular` | Lealtad | `RepositorioSelloCockroach.Acumular` |
| `sello_anular` | Lealtad | `RepositorioSelloCockroach.Anular` |
| `canje_recompensa_aplicar` | Lealtad | `RepositorioSelloCockroach.AplicarCanje` |
| `recordatorio_programar` | Notificaciones | `RepositorioRecordatorioCockroach.Programar` |
| `recordatorio_cancelar` | Notificaciones | `RepositorioRecordatorioCockroach.Cancelar` |
| `conversacion_iniciar` | Canal WhatsApp | `RepositorioConversacionCockroach.Iniciar` |
| `mensaje_registrar` | Canal WhatsApp | `RepositorioMensajeCockroach.Guardar` |
| `sesion_chat_iniciar` | Canal WhatsApp | `RepositorioSesionChatCockroach.Iniciar` |
| `sesion_chat_actualizar` | Canal WhatsApp | `RepositorioSesionChatCockroach.Actualizar` |
| `producto_crear` | Inventario | `RepositorioProductoCockroach.Guardar` **NUEVO** |
| `movimiento_inventario_registrar` | Inventario | `RepositorioMovimientoCockroach.Registrar` **NUEVO** |

### Funciones SIN implementación en Go (21 de 56)

| Función | Módulo | Prioridad |
|---------|--------|-----------|
| `configuracion_empresa_guardar` | Organización | ALTA — config de reservas |
| `tarifa_especial_crear` | Agenda | MEDIA — precios dinámicos |
| `complemento_reserva_agregar` | Reservas | MEDIA — productos adicionales |
| `lista_espera_ingresar` | Reservas | MEDIA — repo listo |
| `comision_generar` | Comisiones | MEDIA |
| `liquidacion_calcular` | Comisiones | MEDIA |
| `liquidacion_aprobar` | Comisiones | MEDIA |
| `liquidacion_pagar` | Comisiones | MEDIA |
| `esquema_comision_crear` | Comisiones | MEDIA |
| `resena_crear` | Reputación | MEDIA |
| `calificacion_barbero_registrar` | Reputación | MEDIA |
| `calificacion_sucursal_registrar` | Reputación | MEDIA |
| `programa_lealtad_crear` | Lealtad | ALTA — repo listo, falta caso de uso |
| `plantilla_mensaje_crear` | Notificaciones | MEDIA |
| `campana_crear` | Campañas | BAJA |
| `campana_programar` | Campañas | BAJA |
| `destinatario_campana_agregar` | Campañas | BAJA |
| `regla_automatizacion_crear` | Campañas | BAJA |
| `evento_calendar_registrar` | Integraciones | BAJA |
| `evento_calendar_actualizar_estado` | Integraciones | BAJA |

---

## Datos semilla (seed_dev.sql)

⚠️ El archivo `seed_dev.sql` existe. **Pendiente verificar sincronización con:**
- Nuevas tablas: `excepcion_disponibilidad` (DDL 05), `movimiento_inventario` (DDL 15)
- Datos requeridos: al menos un `programa_lealtad` para que el módulo de lealtad funcione
- Usuarios de prueba con sus alcances y roles asignados

---

## Gaps críticos de base de datos

1. **`programa_lealtad` sin caso de uso CREAR** — el programa se asume existente vía seed. Sin `CrearProgramaLealtad`, una instalación nueva no puede tener programa de lealtad.
2. **`configuracion_empresa`** — se crea con defaults en `empresa_crear` pero no hay API para modificarla.
3. **`refresh_token_hash`** — `RefrescarSesion` ya implementado en Go. Verificar que el frontend consuma el endpoint.
4. **`plan_limite`** — `control_por_plan.go` solo verifica suscripción activa, no los límites numéricos.
5. **`sesion_whatsapp_empresa`** — almacena token de WhatsApp cifrado pero sin API para gestionar.
6. **`lista_espera`** — repo listo, esperando caso de uso `IngresarListaEspera`.
