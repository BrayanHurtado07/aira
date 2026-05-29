# AIRA — Estado Base de Datos
> Inventario completo de tablas, funciones almacenadas y su conexión con el backend Go.
> Actualizado: 2026-05-28

---

## Resumen ejecutivo

| Módulo | Tablas | Funciones | Repo Go | Casos de uso Go |
|--------|--------|-----------|---------|-----------------|
| Identidad | 3 | 5 | ✅ | ✅ (5/5) |
| Organización | 4 | 4 | ✅ | ✅ (4/4) |
| Gobierno de Acceso | 5 | 2 | ✅ | ✅ (2/2) |
| Monetización | 3 | 3 | ✅ | ✅ (3/3) |
| Agenda | 6 | 5 | ✅ | ✅ (4/4) — faltan 2 funcs |
| Reservas | 5 | 7 | ✅ | ✅ (5/5) — faltan 2 funcs |
| Canal WhatsApp | 5 | 4 | ✅ | ✅ (4/4) |
| Lealtad | 4 | 3 | ✅ | ✅ (3/3) |
| Notificaciones | 3 | 2 | ✅ | ✅ (2/2) |
| **Inventario** | **3** | **1** | ❌ | ❌ (0/1) |
| **Comisiones** | **3** | **4** | ❌ | ❌ (0/4) |
| **Reputación** | **3** | **3** | ❌ | ❌ (0/3) |
| **Campañas** | **4** | **4** | ❌ | ❌ (0/4) |
| **Integraciones** | **2** | **2** | ❌ | ❌ (0/2) |
| **Config. negocio** | **1** | **5** | ❌ | ❌ (0/5) |
| **TOTAL** | **54** | **56** | 9 repos | 31 casos de uso |

> ✅ = implementado · ❌ = no implementado · ⚠️ = parcial

---

## DDL — Todas las tablas

### 01_identidad.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `usuario` | id_usuario, correo_electronico (UNIQUE), contrasena_hash, nombre, telefono, correo_verificado, estado (ACTIVO\|INACTIVO\|ELIMINADO\|BLOQUEADO) | ✅ Repo + casos de uso |
| `sesion_global` | id_sesion_global, id_usuario, token_hash (UNIQUE), refresh_token_hash, ip_origen, user_agent, expira_en, estado (ACTIVA\|EXPIRADA\|REVOCADA) | ✅ Repo + casos de uso |
| `verificacion_correo_electronico` | id_verificacion, id_usuario, codigo_hash, expira_en, usado | ⚠️ Tabla existe, función `verificacion_correo_crear` existe — **sin caso de uso Go** |

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
| `auditoria_accion` | id_auditoria, id_usuario?, id_empresa?, entidad, entidad_id, accion, detalle_json, ip_origen, realizado_en | ✅ (escritura en todos los casos de uso) |

### 04_monetizacion.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `plan` | id_plan, nombre (BASICO\|PRO\|ENTERPRISE), precio_mensual, moneda_plan, estado | ✅ (solo lectura) |
| `plan_limite` | id_plan_limite, id_plan, concepto (MAX_SUCURSALES\|MAX_BARBEROS\|etc), valor | ⚠️ Sin implementación de límites en Go |
| `suscripcion` | id_suscripcion, id_empresa, id_plan, fecha_inicio, fecha_renovacion, estado (ACTIVA\|SUSPENDIDA\|CANCELADA\|VENCIDA) | ✅ |

### 05_agenda.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `barbero` | id_barbero, id_empresa, id_usuario?, nombre, telefono, foto_url, estado | ✅ |
| `servicio` | id_servicio, id_empresa, nombre, duracion_minutos, precio_base, descripcion, estado | ✅ |
| `barbero_servicio` | id_barbero, id_servicio (PK compuesto) | ✅ |
| `disponibilidad` | id_disponibilidad, id_barbero, id_sucursal, dia_semana (0-6), hora_inicio, hora_fin, estado | ✅ |
| `excepcion_disponibilidad` | id_excepcion, id_barbero, id_sucursal, fecha, motivo (FERIADO\|VACACION\|CIERRE\|OTRO), descripcion | ⚠️ Función `excepcion_disponibilidad_registrar` existe — **sin repo ni caso de uso Go** |
| `tarifa_especial` | id_tarifa, id_sucursal, id_servicio, fecha, precio_especial, motivo | ⚠️ Función `tarifa_especial_crear` existe — **sin repo ni caso de uso Go** |

### 06_inventario_base.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `producto` | id_producto, id_empresa, nombre, codigo (UNIQUE por empresa), tipo (INSUMO_BARBERO\|CONSUMIBLE_CLIENTE), precio_unitario, estado | ❌ Sin repo ni caso de uso |
| `stock_sucursal` | id_stock, id_producto, id_sucursal (UNIQUE compuesto), cantidad_actual, cantidad_minima | ❌ Sin repo ni caso de uso |
| `consumo_servicio` | id_servicio, id_producto (PK compuesto), cantidad_estimada | ❌ Sin repo ni caso de uso |

### 07_notificaciones_plantilla.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `plantilla_mensaje` | id_plantilla, id_empresa, nombre, canal (WHATSAPP\|EMAIL), contenido_plantilla, variables_json, estado | ⚠️ Función `plantilla_mensaje_crear` existe — **sin repo ni caso de uso Go** |

### 08_canal_whatsapp.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `sesion_whatsapp_empresa` | id_sesion_wa, id_empresa, numero_telefono, token_acceso_cifrado, proveedor (META_CLOUD\|TWILIO\|BAILEYS), estado | ⚠️ Tabla existe, **sin repo ni caso de uso Go** |
| `conversacion` | id_conversacion, id_empresa, id_cliente?, numero_cliente_wa, estado (ACTIVA\|CERRADA\|EXPIRADA) | ✅ |
| `mensaje` | id_mensaje, id_conversacion, contenido, tipo (TEXTO\|IMAGEN\|AUDIO\|etc), direccion (ENTRADA\|SALIDA), id_externo_wa, estado_entrega | ✅ |
| `sesion_chat` | id_sesion_chat, id_conversacion (UNIQUE), paso_actual, contexto_json, expira_en | ✅ |
| `indicacion_bot` | id_indicacion, id_empresa, nombre, tipo (SALUDO\|MENU_PRINCIPAL\|etc), contenido, activa | ⚠️ Sin repo ni caso de uso Go |

### 09_reservas.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `cliente` | id_cliente, id_empresa, nombre, telefono (UNIQUE por empresa), correo_electronico?, fecha_nacimiento?, estado | ✅ |
| `reserva` | id_reserva, id_empresa, id_cliente, id_barbero, id_sucursal, id_periodo, fecha_hora_inicio, fecha_hora_fin, estado (PENDIENTE\|CONFIRMADA\|COMPLETADA\|CANCELADA\|NO_ASISTIO), origen (WHATSAPP\|WEB\|MANUAL) | ✅ |
| `reserva_servicio` | id_reserva, id_servicio (PK compuesto), precio_acordado | ✅ (vía stored proc) |
| `complemento_reserva` | id_reserva, id_producto (PK compuesto), cantidad | ⚠️ Función `complemento_reserva_agregar` existe — **sin repo ni caso de uso Go** |
| `lista_espera` | id_lista_espera, id_empresa, id_cliente, id_sucursal, id_servicio, id_barbero?, fecha_hora_deseada, estado (ESPERANDO\|NOTIFICADO\|EXPIRADO\|ATENDIDO) | ⚠️ Función `lista_espera_ingresar` existe — **sin repo ni caso de uso Go** |

### 10_campanias.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `campana` | id_campana, id_empresa, id_plantilla_mensaje, nombre, tipo (MANUAL\|AUTOMATICA), estado (BORRADOR\|ENVIANDO\|COMPLETADA\|PAUSADA\|CANCELADA), programada_para | ❌ |
| `regla_automatizacion` | id_regla, id_campana, condicion (CUMPLEANIOS\|INACTIVIDAD_30_DIAS\|SELLO_ACUMULADO\|RESERVA_COMPLETADA), parametros_json, activa | ❌ |
| `destinatario_campana` | id_campana, id_cliente (PK compuesto) | ❌ |
| `log_envio_campana` | id_log_envio, id_campana, id_cliente, resultado (PENDIENTE\|ENVIADO\|FALLIDO), enviado_en, error_descripcion | ❌ |

### 11_comisiones.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `esquema_comision` | id_esquema, id_empresa, nombre, tipo (PORCENTAJE\|FIJO\|MIXTO), sueldo_base, porcentaje_por_servicio, estado | ❌ |
| `liquidacion` | id_liquidacion, id_barbero, id_empresa, fecha_inicio, fecha_fin, monto_total, frecuencia, estado (CALCULADA\|APROBADA\|PAGADA) | ❌ |
| `comision` | id_comision, id_barbero, id_reserva (UNIQUE), id_esquema_comision, id_liquidacion?, monto_calculado, estado (PENDIENTE\|INCLUIDA_EN_LIQUIDACION\|ANULADA) | ❌ |

### 12_lealtad.sql

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `programa_lealtad` | id_programa, id_empresa, nombre, sellos_para_recompensa, descripcion_recompensa, estado | ⚠️ Función `programa_lealtad_crear` existe — **sin caso de uso dedicado** (solo lectura en Go) |
| `tarjeta_lealtad` | id_tarjeta, id_programa, id_cliente (UNIQUE compuesto), estado (ACTIVA\|SUSPENDIDA\|ELIMINADA) | ✅ (creación automática vía sello_acumular) |
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
| `log_notificacion` | id_log_notificacion, id_recordatorio, resultado (ENVIADO\|FALLIDO), enviado_en, error_descripcion | ⚠️ Sin repo ni caso de uso — solo se escribe vía stored proc interno |

### 15_inventario_movimientos.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `movimiento_inventario` | id_movimiento, id_producto, id_sucursal, id_reserva?, tipo_movimiento (COMPRA\|CONSUMO_SERVICIO\|CONSUMO_COMPLEMENTO\|AJUSTE\|DEVOLUCION), cantidad, causa_descripcion, registrado_por | ❌ |

### 16_integraciones.sql ❌ SIN IMPLEMENTACIÓN BACKEND

| Tabla | Columnas clave | Estado backend |
|-------|----------------|----------------|
| `token_google_calendar` | id_token, id_empresa (UNIQUE), access_token_cifrado, refresh_token_cifrado, expira_en, correo_propietario, estado (ACTIVO\|REVOCADO) | ❌ |
| `evento_calendar` | id_evento_calendar, id_reserva (UNIQUE), id_empresa, id_google_event, estado (PENDIENTE\|CREADO\|ACTUALIZADO\|ELIMINADO) | ❌ |

---

## Funciones almacenadas — inventario completo

### Funciones implementadas en Go (29 de 56)

| Función | Módulo | Llamada desde |
|---------|--------|---------------|
| `usuario_registrar` | Identidad | `RepositorioUsuarioCockroach.Guardar` |
| `usuario_iniciar_sesion` | Identidad | `RepositorioSesionCockroach.Guardar` |
| `usuario_cerrar_sesion` | Identidad | `RepositorioSesionCockroach.Revocar` |
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

### Funciones SIN implementación en Go (27 de 56)

| Función | Módulo | Prioridad |
|---------|--------|-----------|
| `usuario_verificar_correo` | Identidad | ALTA — flujo de registro incompleto |
| `verificacion_correo_crear` | Identidad | ALTA — flujo de registro incompleto |
| `configuracion_empresa_guardar` | Organización | ALTA — config de reservas |
| `excepcion_disponibilidad_registrar` | Agenda | MEDIA — bloqueo de días |
| `tarifa_especial_crear` | Agenda | MEDIA — precios dinámicos |
| `complemento_reserva_agregar` | Reservas | MEDIA — productos adicionales |
| `lista_espera_ingresar` | Reservas | MEDIA |
| `movimiento_inventario_registrar` | Inventario | BAJA (capacidad nueva) |
| `comision_generar` | Comisiones | MEDIA |
| `liquidacion_calcular` | Comisiones | MEDIA |
| `liquidacion_aprobar` | Comisiones | MEDIA |
| `liquidacion_pagar` | Comisiones | MEDIA |
| `resena_crear` | Reputación | MEDIA |
| `calificacion_barbero_registrar` | Reputación | MEDIA |
| `calificacion_sucursal_registrar` | Reputación | MEDIA |
| `recordatorio_cancelar` ya implementado | — | — |
| `esquema_comision_crear` | Config. negocio | MEDIA |
| `programa_lealtad_crear` | Config. negocio | ALTA — sin esto no hay programa lealtad |
| `plantilla_mensaje_crear` | Config. negocio | MEDIA |
| `producto_crear` | Config. negocio | BAJA |
| `tarifa_especial_crear` | Config. negocio | MEDIA |
| `campana_crear` | Campañas | BAJA (capacidad nueva) |
| `campana_programar` | Campañas | BAJA |
| `destinatario_campana_agregar` | Campañas | BAJA |
| `regla_automatizacion_crear` | Campañas | BAJA |
| `evento_calendar_registrar` | Integraciones | BAJA |
| `evento_calendar_actualizar_estado` | Integraciones | BAJA |

---

## Datos semilla (seed_dev.sql)

El archivo `seed_dev.sql` existe y contiene datos de desarrollo. **No se ha verificado si está sincronizado con el DDL actual.**

---

## Gaps críticos de base de datos

1. **`programa_lealtad` no tiene caso de uso CREAR** — actualmente el programa se asume existente; no hay endpoint para crearlo desde el frontend.
2. **`configuracion_empresa`** — tabla creada por `empresa_crear` con defaults, pero no hay endpoint para modificarla.
3. **`refresh_token_hash`** en `sesion_global` — columna existe, `usuario_iniciar_sesion` la recibe, pero Go no implementa el flujo de renovación.
4. **`plan_limite`** — tabla `plan_limite` define los límites del plan (MAX_BARBEROS, etc.) pero `control_por_plan.go` solo verifica si hay suscripción activa, no valida los límites.
5. **`sesion_whatsapp_empresa`** — almacena el token de WhatsApp cifrado pero no hay API para registrar/gestionar la conexión.
