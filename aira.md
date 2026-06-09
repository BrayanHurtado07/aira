# AIRA — Estado General del Proyecto
> Documento maestro. Para detalle de BD ver `aira-base-datos.md`. Para backend ver `aira-backend.md`.
> Actualizado: 2026-06-09

---

## Qué es AIRA

**AIRA** (ex Serbio) es un SaaS de gestión de barberías con chatbot de WhatsApp, construido bajo el estándar **Codeplex** (Arquitectura Composable).

- **Stack:** Go (backend) · CockroachDB (base de datos) · React + TypeScript (frontend)
- **Multi-tenant:** una instalación sirve N barberías, cada una con N sucursales
- **Contexto operativo:** toda operación requiere `empresa + sede + periodo`
- **Bot:** Serbio/Luna IA atiende reservas vía WhatsApp sin intervención humana
- **Landing pública:** `PaginaAterrizaje` en `/` visible sin autenticación
- **Reserva pública:** wizard de 5 pasos en `/reserva/:sucursalSlug` para clientes externos

---

## Mapa de capacidades

| Capacidad | BD ✅ | Backend ✅ | Frontend ✅ | Producción |
|-----------|------|-----------|-----------|-----------|
| **Identidad** | ✅ completo | ✅ 10 casos de uso | ✅ login, gestión, verificación, reset | ⚠️ flujos de email (verificación + reset) requieren servicio SMTP |
| **Organización** | ✅ completo | ✅ 4 casos de uso | ✅ sedes + períodos | ⚠️ falta config empresa (UI + caso de uso) |
| **Gobierno de Acceso** | ✅ completo | ✅ 2 casos de uso | ✅ alcances | ⚠️ GuardiaPoliticas no integrada a handlers |
| **Monetización** | ✅ completo | ✅ 3 casos de uso | ✅ suscripciones | ⚠️ límites de plan no validados |
| **Agenda** | ✅ completo | ✅ 6 casos de uso | ✅ barberos + servicios + excepciones | ⚠️ falta UI para tarifas especiales |
| **Reservas** | ✅ completo | ✅ 5 casos de uso | ✅ reservas + clientes + lista espera | ⚠️ lista espera sin backend; falta no-asistio + complementos |
| **Canal WhatsApp** | ✅ completo | ✅ 4 casos de uso | ✅ conversaciones | ⚠️ bot básico, sin IA real; sin sesión WA empresa |
| **Lealtad** | ✅ completo | ✅ 3 casos de uso | ✅ sellos + canjes + crear programa | ⚠️ repo programas listo, falta caso de uso CrearProgramaLealtad |
| **Notificaciones** | ✅ completo | ✅ 2 casos de uso | ✅ plantillas + recordatorios | ❌ sin worker de despacho |
| **Tablero** | ✅ BD/queries | ✅ 1 caso de uso + repo | ✅ métricas en tiempo real | ✅ funcional |
| **Inventario** | ✅ BD+funcs | ✅ 2 casos de uso parciales | ✅ PaginaInventario | ⚠️ faltan endpoints GET productos/stock |
| **Comisiones** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |
| **Reputación** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |
| **Campañas** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |
| **Integraciones** | ✅ BD+funcs | ❌ 0 casos de uso | ❌ sin páginas | ❌ capacidad no iniciada |
| **Landing** | — | — | ✅ PaginaAterrizaje | ✅ funcional |
| **Reserva Pública** | — | ❌ sin endpoints públicos | ✅ wizard 5 pasos | ❌ frontend sin backend |

---

## Estado del frontend — páginas existentes

| Ruta | Página | Estado | Rol |
|------|--------|--------|-----|
| `/` | PaginaAterrizaje | ✅ funcional | Público |
| `/iniciar-sesion` | PaginaInicioSesion | ✅ funcional | Público |
| `/verificar-correo` | PaginaVerificarCorreo | ✅ existe | Público |
| `/solicitar-reset` | PaginaSolicitarResetPassword | ✅ existe | Público |
| `/restablecer-password` | PaginaRestablecerPassword | ✅ existe | Público |
| `/reserva/:sucursalSlug` | PaginaReservaPublica | ✅ wizard completo | Público (sin auth) |
| `/tablero` | PaginaInicioTablero | ✅ métricas reales | Admin + Barbero |
| `/organizacion` | PaginaOrganizacion | ✅ sedes + períodos | Admin |
| `/gobierno-acceso` | PaginaAlcances | ✅ funcional | Admin |
| `/monetizacion` | PaginaSuscripcion | ✅ funcional | Admin |
| `/agenda/barberos` | PaginaGestionBarberos | ✅ master-detail responsivo | Admin |
| `/agenda/servicios` | PaginaGestionServicios | ✅ funcional | Admin |
| `/agenda/disponibilidad` | PaginaAgendaBarbero | ✅ bloques + excepciones | Admin |
| `/agenda/tarifas` | PaginaTarifasEspeciales | ✅ existe | Admin |
| `/reservas` | PaginaReservas | ✅ tabs + acciones | Admin + Barbero |
| `/reservas/nueva` | PaginaNuevaReserva | ✅ funcional | Admin + Barbero |
| `/reservas/clientes` | PaginaGestionClientes | ✅ funcional | Admin + Barbero |
| `/reservas/:id` | PaginaDetalleReserva | ✅ funcional | Admin + Barbero |
| `/reservas/lista-espera` | PaginaListaEspera | ✅ UI existe | Admin + Barbero |
| `/canal-whatsapp` | PaginaConversaciones | ✅ funcional | Admin |
| `/canal-whatsapp/:id` | PaginaDetalleConversacion | ✅ funcional | Admin |
| `/lealtad` | PaginaLealtad | ✅ funcional | Admin |
| `/notificaciones` | PaginaRecordatorios | ✅ funcional | Admin |
| `/notificaciones/plantillas` | PaginaPlantillas | ✅ existe | Admin |
| `/inventario` | PaginaInventario | ✅ 3 pestañas | Admin |
| `/usuarios` | PaginaGestionUsuarios | ✅ existe | Admin |

**Total páginas: 26** (era 16 en la documentación anterior)

### Páginas faltantes en frontend

| Ruta | Página requerida | Prioridad |
|------|-----------------|-----------|
| `/organizacion/configuracion` | Configuración de empresa (horarios, anticipación) | ALTA |
| `/comisiones` | Dashboard de comisiones | MEDIA |
| `/comisiones/esquemas` | Esquemas de comisión | MEDIA |
| `/comisiones/liquidaciones` | Liquidaciones de barberos | MEDIA |
| `/reputacion` | Reseñas y calificaciones | MEDIA |
| `/campanias` | Campañas de marketing | BAJA |
| `/integraciones` | Conexión Google Calendar, WhatsApp API | BAJA |

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

`BannerAlerta`, `Boton`, `Campo`, `CampoEmail`, `CampoMoneda`, `CampoNumerico`, `DialogoConfirmacion`, `EncabezadoPagina`, `Insignia`, `Interruptor`, `MenuAcciones`, `Modal`, `Pestanas`, `SeccionTarjeta`, `Selector`, `SelectorDuracion`, `SelectorFecha`, `SelectorSlot`, `SelectorTelefono`, `TablaDatos`, `Cargando`, `Esqueleto`, `PantallaCarga`, `Vacio`

### Retroalimentación

`Cargando`, `Esqueleto`, `Insignia`, `PantallaCarga`, `Vacio`

---

## Métricas de implementación

| Capa | Total diseñado | Implementado real | % real |
|------|---------------|-------------------|--------|
| Tablas BD | 54 | 54 | **100%** |
| Funciones almacenadas | 56 | 56 | **100%** |
| Repos Go | ~56 | ~35 | **~63%** |
| Casos de uso Go | ~55 | **~38** | **~69%** |
| Endpoints HTTP | ~105 | ~78 | **~74%** |
| Páginas frontend | ~30 | **26** | **~87%** |
| Capacidades en producción | 16 | 11 | **69%** |
| Capacidades completas (BD+BE+FE) | 16 | 9 | **56%** |

---

## Gaps críticos — lo que bloquea producción

### 🔴 Bloqueantes inmediatos

1. **GuardiaPoliticas no integrada** — cualquier JWT válido puede acceder a cualquier endpoint. Los permisos por rol existen en BD (`alcance → rol → permiso`) pero `PuedeEjecutar()` no se llama desde los handlers.

2. **Reserva pública sin backend** — `PaginaReservaPublica` (wizard completo) no tiene endpoints públicos (`/api/publica/*`). El flujo está partido.

3. **Landing page routing** — `PaginaAterrizaje` está registrada en `rutasPublicas`, verificar que no quede bloqueada por un redirect de `GuardiaAutenticacion` cuando hay sesión activa.

4. **CrearProgramaLealtad** — repo + entidad listos. Sin `CrearProgramaLealtad`, una barbería nueva no puede tener programa de lealtad.

5. **GuardarConfiguracionEmpresa** — los parámetros de reserva (anticipación, confirmación manual) quedan con defaults fijos para siempre.

### 🟡 Importantes para MVP completo

6. **Worker de notificaciones** — `recordatorio_programado` acumula filas sin que nadie las despache.

7. **8 handlers directos al repo** — sin auditoría ni eventos (barbero/servicio/cliente update + estado, sucursal estado, periodo cerrar).

8. **Validación de límites de plan** — `plan_limite` no se consulta en `control_por_plan.go`.

9. **Comisiones** — capacidad completa en BD, cero en Go y frontend.

10. **Inventario incompleto** — faltan `GET /api/productos` y `GET /api/inventario/stock`.

### 🟠 Funcionalidades de negocio relevantes

11. **Lista de espera** — UI completa en frontend, repo listo, falta caso de uso + endpoint.

12. **MarcarNoAsistio** — estado existe en BD, sin caso de uso ni endpoint.

13. **Reputación** — BD completa, sin código.

14. **Campañas** — BD completa, sin código.

---

## Diferenciación por rol (implementada)

| Comportamiento | Admin | Barbero |
|----------------|-------|---------|
| Menú lateral | Completo (12+ ítems) | Reducido (Tablero, Reservas, Clientes) |
| Dashboard | Métricas completas | Métricas personales |
| Chip de rol | No visible | Visible en ámbar |

---

## Estructura de carpetas

```
aira/
├── backend/
│   ├── aplicacion/entrada/http/     # servidor, rutas, middleware, respuestas
│   ├── capacidades/                 # dominios del negocio
│   │   ├── agenda/                  # barberos, servicios, disponibilidad, excepciones, tarifas
│   │   ├── canal_whatsapp/
│   │   ├── gobierno_acceso/
│   │   ├── identidad/               # usuarios, sesiones, verificaciones
│   │   ├── inventario/              # productos, movimientos [PARCIAL]
│   │   ├── lealtad/                 # sellos, tarjetas, programas
│   │   ├── monetizacion/
│   │   ├── notificaciones/
│   │   ├── organizacion/
│   │   ├── reservas/                # reservas, clientes, lista_espera
│   │   └── tablero/                 # métricas [NUEVO]
│   ├── cmd/aira/main.go
│   ├── compartido/
│   └── plataforma/
├── database/
│   ├── ddl/                         # 16 archivos, 54 tablas
│   ├── funciones/                   # 18 archivos, 56 funciones almacenadas
│   └── seed_dev.sql                 # ⚠️ pendiente verificar sincronización con DDL actual
└── frontend/
    └── src/
        ├── aplicacion/              # arranque, rutas públicas y privadas, estilos globales
        ├── capacidades/             # 12 capacidades (incluyendo aterrizaje y reserva-publica)
        ├── compartido/              # primitivas UI reutilizables
        ├── integraciones/           # HTTP client con Bearer auto
        └── plataforma/              # identidad, contexto, caparazón, gobierno
```

---

## Próximos pasos recomendados (por orden de impacto)

```
CRÍTICO — bloquea seguridad o flujo base:
[ ] 1. Integrar GuardiaPoliticas en handlers de escritura (POST/PATCH/DELETE)
[ ] 2. Crear endpoints públicos /api/publica/* para PaginaReservaPublica
[ ] 3. Verificar redirect de landing cuando hay sesión activa

ALTA — completan funcionalidades prometidas:
[ ] 4. CrearProgramaLealtad — caso de uso + endpoint + conectar a UI existente
[ ] 5. GuardarConfiguracionEmpresa — repo + caso de uso + endpoints + página UI
[ ] 6. IngresarListaEspera — caso de uso + endpoint (UI ya existe)
[ ] 7. Convertir 8 handlers directos → casos de uso (eventos + auditoría)
[ ] 8. InventarioCapacidad — GET /api/productos y GET /api/inventario/stock

MEDIA — producto más completo:
[ ] 9. Worker de notificaciones (goroutine con ticker)
[ ] 10. ValidarLimitesPlan en control_por_plan.go
[ ] 11. MarcarNoAsistio — caso de uso + endpoint
[ ] 12. ComisionesCapacidad — completo (repo + 5 casos de uso + 3 páginas)
[ ] 13. ReputacionCapacidad

BAJA — nice-to-have:
[ ] 14. CampaniasCapacidad
[ ] 15. IntegracionesCapacidad — Google Calendar
[ ] 16. Tests unitarios mínimos (casos de uso críticos)
[ ] 17. Verificar seed_dev.sql contra DDL actual
[ ] 18. Publicador real de eventos (Redis Streams)
```
