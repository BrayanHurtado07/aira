# AIRA — Estado General del Proyecto
> Documento maestro. Para detalle de BD ver `aira-base-datos.md`. Para backend ver `aira-backend.md`.
> Actualizado: 2026-05-28

---

## Qué es AIRA

**AIRA** (ex Serbio) es un SaaS de gestión de barberías con chatbot de WhatsApp, construido bajo el estándar **Codeplex** (Arquitectura Composable).

- **Stack:** Go (backend) · CockroachDB (base de datos) · React + TypeScript (frontend)
- **Multi-tenant:** una instalación sirve N barberías, cada una con N sucursales
- **Contexto operativo:** toda operación requiere `empresa + sede + periodo`
- **Bot:** Serbio/Luna IA atiende reservas vía WhatsApp sin intervención humana

---

## Mapa de capacidades

| Capacidad | BD ✅ | Backend ✅ | Frontend ✅ | Producción |
|-----------|------|-----------|-----------|-----------|
| **Identidad** | ✅ completo | ✅ 5 casos de uso | ✅ login, gestión | ⚠️ falta verificar correo |
| **Organización** | ✅ completo | ✅ 4 casos de uso | ✅ sedes + períodos | ⚠️ falta config empresa |
| **Gobierno de Acceso** | ✅ completo | ✅ 2 casos de uso | ✅ alcances | ⚠️ GuardiaPoliticas no integrada |
| **Monetización** | ✅ completo | ✅ 3 casos de uso | ✅ suscripciones | ⚠️ falta validar límites de plan |
| **Agenda** | ✅ completo | ✅ 4 casos de uso | ✅ barberos + servicios | ⚠️ faltan excepciones + tarifas |
| **Reservas** | ✅ completo | ✅ 5 casos de uso | ✅ reservas + clientes | ⚠️ faltan complementos + lista espera |
| **Canal WhatsApp** | ✅ completo | ✅ 4 casos de uso | ✅ conversaciones | ⚠️ bot básico, sin IA real |
| **Lealtad** | ✅ completo | ✅ 3 casos de uso | ✅ sellos + canjes | ⚠️ falta crear programa desde UI |
| **Notificaciones** | ✅ completo | ✅ 2 casos de uso | ✅ recordatorios | ❌ sin worker de despacho |
| **Comisiones** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |
| **Reputación** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |
| **Inventario** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |
| **Campañas** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |
| **Integraciones** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |

---

## Estado del frontend — páginas existentes

| Ruta | Página | Estado | Rol |
|------|--------|--------|-----|
| `/iniciar-sesion` | PaginaInicioSesion | ✅ funcional | Público |
| `/tablero` | PaginaInicioTablero | ✅ funcional | Admin + Barbero (diferenciado) |
| `/organizacion` | PaginaOrganizacion | ✅ sedes + períodos | Admin |
| `/gobierno-acceso` | PaginaAlcances | ✅ funcional | Admin |
| `/monetizacion` | PaginaSuscripcion | ✅ funcional | Admin |
| `/agenda/barberos` | PaginaGestionBarberos | ✅ master-detail responsivo | Admin |
| `/agenda/servicios` | PaginaGestionServicios | ✅ funcional | Admin |
| `/reservas` | PaginaReservas | ✅ tabs + acciones | Admin + Barbero |
| `/reservas/nueva` | PaginaNuevaReserva | ✅ funcional | Admin + Barbero |
| `/reservas/clientes` | PaginaGestionClientes | ✅ funcional | Admin + Barbero |
| `/reservas/:id` | PaginaDetalleReserva | ✅ funcional | Admin + Barbero |
| `/canal-whatsapp` | PaginaConversaciones | ✅ funcional | Admin |
| `/canal-whatsapp/:id` | PaginaDetalleConversacion | ✅ funcional | Admin |
| `/lealtad` | PaginaLealtad | ✅ funcional | Admin |
| `/notificaciones` | PaginaRecordatorios | ✅ funcional | Admin |
| `/usuarios` | PaginaGestionUsuarios | ✅ existe | Admin |

### Páginas faltantes en frontend

| Ruta | Página requerida | Prioridad |
|------|-----------------|-----------|
| `/organizacion/configuracion` | Configuración de empresa (horarios, anticipación) | ALTA |
| `/lealtad/programa` | Crear/editar programa de lealtad | ALTA |
| `/agenda/barberos/:id/excepciones` | Excepciones de disponibilidad (feriados, vacaciones) | MEDIA |
| `/agenda/tarifas` | Tarifas especiales por fecha | MEDIA |
| `/comisiones` | Dashboard de comisiones | MEDIA |
| `/comisiones/esquemas` | Esquemas de comisión | MEDIA |
| `/comisiones/liquidaciones` | Liquidaciones de barberos | MEDIA |
| `/reputacion` | Reseñas y calificaciones | MEDIA |
| `/inventario` | Gestión de productos y stock | BAJA |
| `/campanias` | Campañas de marketing | BAJA |
| `/integraciones` | Conexión Google Calendar, WhatsApp API | BAJA |
| `/auth/verificar-correo` | Confirmación de email tras registro | ALTA |
| `/auth/cambiar-password` | Página de restablecimiento de contraseña | MEDIA |

---

## Componentes compartidos (plataforma)

### Implementados

| Componente | Ubicación | Estado |
|------------|-----------|--------|
| `GuardiaAutenticacion` | `plataforma/identidad/` | ✅ |
| `GuardiaCapacidad` | `plataforma/activacion/` | ✅ |
| `GuardiaPermiso` | `plataforma/activacion/` | ⚠️ existe pero no usado en rutas |
| `SelectorContexto` | `plataforma/contexto/` | ⚠️ existe pero no verificado en cabecera |
| `DisposicionCaparazon` | `plataforma/caparazon/` | ✅ sidebar + header fijos |
| `BarraLateralCaparazon` | `plataforma/caparazon/` | ✅ filtrada por rol |
| `CabeceraCaparazon` | `plataforma/caparazon/` | ✅ |
| Almacén de sesión (Zustand) | `plataforma/identidad/almacen-sesion.ts` | ✅ con `nombreRol` |
| Almacén de contexto (Zustand) | `plataforma/contexto/almacen-contexto.ts` | ✅ |
| HTTP client | `integraciones/http/cliente.ts` | ✅ con Bearer token auto |

### Primitivas UI compartidas

`BannerAlerta`, `Boton`, `Campo`, `CampoEmail`, `CampoMoneda`, `CampoNumerico`, `DialogoConfirmacion`, `EncabezadoPagina`, `Interruptor`, `MenuAcciones`, `Modal`, `Pestanas`, `SeccionTarjeta`, `Selector`, `SelectorDuracion`, `SelectorFecha`, `SelectorSlot`, `SelectorTelefono`, `TablaDatos`, `Cargando`, `Esqueleto`, `Insignia`, `PantallaCarga`, `Vacio`

---

## Métricas de implementación

| Capa | Total diseñado | Implementado | % |
|------|---------------|-------------|---|
| Tablas BD | 54 | 54 | 100% |
| Funciones almacenadas | 56 | 56 | 100% |
| Repos Go conectados a funcs | 56 | 29 | 52% |
| Casos de uso Go | ~55 estimados | 31 | 56% |
| Endpoints HTTP | ~105 estimados | 70+ | 67% |
| Páginas frontend | ~30 estimadas | 16 | 53% |
| Capacidades en producción | 14 | 9 | 64% |
| Capacidades completas (BD+BE+FE) | 14 | 7 | 50% |

---

## Gaps críticos — lo que bloquea producción

### 🔴 Bloqueantes inmediatos

1. **Verificación de correo** — sin esto el registro de usuarios no está completo. La tabla y función existen, solo falta el caso de uso Go + endpoint + página frontend.

2. **Crear programa de lealtad desde UI** — actualmente el programa debe existir en la base de datos como seed. Sin `CrearProgramaLealtad`, el módulo de lealtad no funciona en una instalación nueva.

3. **Configuración de empresa** — los parámetros de reserva (horas de anticipación, días máximos, confirmación manual) son críticos para el flujo de reservas. La tabla y función existen, falta caso de uso + UI.

4. **GuardiaPoliticas no integrada** — los handlers no verifican permisos reales del rol. Actualmente cualquier usuario autenticado puede hacer cualquier cosa (solo se valida JWT). La tabla `alcance → rol → permiso` existe completa.

### 🟡 Importantes para MVP completo

5. **Worker de notificaciones** — sin un proceso que lea `recordatorio_programado` y envíe vía WhatsApp/email, las notificaciones son datos muertos.

6. **Comisiones** — capacidad completa en BD y funciones, cero en Go y cero en frontend. Necesaria para que los barberos vean sus pagos.

7. **Validación de límites de plan** — `plan_limite` define MAX_BARBEROS, MAX_SUCURSALES, etc., pero `control_por_plan.go` no los valida. Un plan BASICO podría exceder sus límites.

8. **Handlers que bypasean casos de uso** — 8 endpoints actualizando entidades directamente al repo, sin publicar eventos ni auditoría (barbero/servicio/cliente update + estado, sucursal estado, periodo cerrar).

### 🟠 Funcionalidades de negocio relevantes

9. **Excepciones de disponibilidad** — barberos no pueden bloquear días específicos (feriados, vacaciones).

10. **Lista de espera** — si un slot no está disponible, el cliente no puede quedar en espera.

11. **Reputación** — sin reseñas no hay retroalimentación sobre calidad de servicio.

12. **Campañas de marketing** — la capacidad está 100% diseñada en BD pero inexistente en código.

---

## Diferenciación por rol (implementada)

El flujo de autenticación ya devuelve `nombre_rol` consultando la tabla `alcance → rol`. El frontend usa esto para:

| Comportamiento | Admin | Barbero |
|----------------|-------|---------|
| Menú lateral | Completo (11 ítems) | Reducido (3 ítems: Tablero, Reservas, Clientes) |
| Dashboard | 4 acciones rápidas | 2 acciones rápidas |
| Chip de rol | No visible | Visible en ámbar |
| Subtitle sidebar | "Barbería Admin" | "Panel Barbero" |

---

## Estructura de carpetas

```
aira/
├── backend/
│   ├── aplicacion/entrada/http/     # servidor, rutas, middleware, respuestas
│   ├── capacidades/                 # dominios del negocio (9 implementados)
│   │   ├── agenda/
│   │   ├── canal_whatsapp/
│   │   ├── gobierno_acceso/
│   │   ├── identidad/
│   │   ├── lealtad/
│   │   ├── monetizacion/
│   │   ├── notificaciones/
│   │   ├── organizacion/
│   │   └── reservas/
│   ├── cmd/aira/main.go             # punto de entrada, inyección de dependencias
│   ├── compartido/                  # errores, eventos, tipos
│   ├── persistencia/cockroach/      # repositorios CockroachDB (9 archivos)
│   └── plataforma/                  # JWT, contexto, auditoría, activación
├── database/
│   ├── ddl/                         # 16 archivos, 54 tablas
│   ├── funciones/                   # 18 archivos, 56 funciones almacenadas
│   └── seed_dev.sql
└── frontend/
    └── src/
        ├── aplicacion/              # arranque, rutas, estilos globales
        ├── capacidades/             # 9 capacidades (páginas, ganchos, servicios, contratos)
        ├── compartido/              # primitivas UI reutilizables
        ├── integraciones/           # HTTP client
        └── plataforma/              # identidad, contexto, caparazón, gobierno
```

---

## Próximos pasos recomendados (por orden de impacto)

```
[ ] 1. Integrar GuardiaPoliticas en handlers críticos
[ ] 2. CrearProgramaLealtad — caso de uso + endpoint + página
[ ] 3. VerificarCorreo + RestablecerPassword — flujos completos
[ ] 4. GuardarConfiguracionEmpresa — caso de uso + endpoint + página
[ ] 5. Convertir 8 handlers directos → casos de uso (auditoría + eventos)
[ ] 6. Worker de notificaciones (goroutine con ticker o cron)
[ ] 7. RegistrarExcepcionDisponibilidad — caso de uso + endpoint + UI en PaginaGestionBarberos
[ ] 8. ComisionesCapacidad — repo + 5 casos de uso + 6 endpoints + 3 páginas
[ ] 9. ReputacionCapacidad — repo + 3 casos de uso + 4 endpoints + 1 página
[ ] 10. ValidarLimitesPlan en control_por_plan.go
[ ] 11. ListaEspera + ComplementoReserva — funciones listas, solo falta Go + UI
[ ] 12. InversionCapacidad — productos + stock + movimientos
[ ] 13. CampaniasCapacidad — CRUD + automatización
[ ] 14. IntegracionesCapacidad — Google Calendar
[ ] 15. Publicador real de eventos (Redis Streams)
[ ] 16. Refresh token
```
