# PLAN MAESTRO — Aira (Serbio → Aira)

> SaaS de barberías por WhatsApp · Go + CockroachDB + React/TS · estándar Codeplex (composable).
> Documento vivo: la hoja de ruta de "dónde estamos" y "qué falta" para llegar a un producto vendible.
> Última actualización: 2026-06-28.

---

## 0. Estado actual (resumen ejecutivo)

| Capa | Estado |
|---|---|
| **Backend** | ✅ Funcionalmente COMPLETO: 16 capacidades vivas (BD + Go), bot conversacional Aira IA con agendamiento, pasarela de pago, seguridad por permiso+rol+alcance+contexto. Compila, `vet` limpio, suite de tests verde. |
| **Frontend** | 🟡 Existe y es grande (104 componentes, arquitectura por capacidades, sistema de primitivas + tokens). **No vendible aún**: falta pulido visual, consistencia, 3 críticos y 3 páginas. Camino elegido: **OVERHAUL** (no rebuild). |
| **Producción** | 🔴 Pendiente: integraciones externas reales (pago, Google, WhatsApp saliente, correo) detrás de interfaces YA listas. |

**Veredicto QA: NO listo para vender** — pero la base es sólida (build limpio, ~26/28 pantallas cableadas a datos reales, sidebar responsivo, gating por rol correcto una vez arreglado el bug de nombres).

---

## 1. Lo que YA está hecho (no rehacer)

### Backend — 16 capacidades + transversales
- Identidad, Organización, Gobierno de acceso, Agenda, Reservas, Canal WhatsApp, Monetización, Lealtad,
  Notificaciones, Inventario, Comisiones, Reputación, Integraciones (Google Calendar), Campañas, Tablero, Pagos.
- **Aira IA**: cerebro conversacional (reglas en dev / Claude real con `ANTHROPIC_API_KEY`) + máquina de estados
  de agendamiento completa (sede→servicio→fecha→confirmar→reserva) + webhook Meta (verify GET + receive POST) +
  envío saliente vía Meta Cloud API (descifra token por empresa).
- **Pagos**: tabla `pago_suscripcion` + función `pago_registrar` + pasarela detrás de interfaz `PasarelaPago`
  (hoy `PasarelaSimulada`; el proveedor real se enchufa por config). Cobro reactiva suscripción suspendida.
- **Seguridad**: permiso `CANAL_GESTIONAR` y demás; pertenencia por-registro (tenant) en rutas de canal; cobros
  validan pertenencia. Errores de dominio tipados → HTTP correcto (402/404/409…).
- **Tests**: dominio de reservas (matriz estados×guardas), cliente, máquina de estados del bot, intérprete de
  intención, cobro de suscripción. CI en `.github/workflows/ci.yml` (vet + build + test bloqueantes).

### Frontend — base existente
- Stack: React 18 + TS + Vite + react-router 6 + zustand + react-query + Radix + `tokens.css` (sin Tailwind).
- Sistema de diseño: `compartido/interfaz/primitivas/` (18) + `retroalimentacion/` (5) + `ESTANDARES-PRIMITIVAS.md`.
- HTTP único `integraciones/http/cliente.ts` (`clienteHttp`, Bearer) + `esErrorDominio`. Auth `GuardiaAutenticacion`.
- ~26/28 pantallas ya consultan endpoints reales.

### Herramientas creadas (skills/agentes)
- `.claude/skills/sistema-diseno` — enforcer visual (primitivas, tokens, responsividad, a11y, estados).
- `.claude/skills/cablear-api` — conectar pantallas a endpoints reales con el patrón correcto.
- `.claude/agents/disenador-paginas` — diseña el plano UX de cada pantalla por contexto.
- `.claude/agents/qa-tester` — audita flujos y reporta bugs/vacíos priorizados.

---

## 2. Problemas detectados (auditoría QA) — el backlog real

### 🔴 Críticos
1. ✅ **HECHO** — Canal WhatsApp: faltaban `GET /conversaciones` y `GET /mensajes` (solo había POST). Agregados al
   backend con permiso + tenant. Probado.
2. ✅ **HECHO** — Login bloqueaba al admin: el frontend exigía rol `'ADMIN_BARBERIA'` pero el backend devuelve
   `'ADMIN'` → `GuardiaRol` mandaba al admin a un bucle infinito en `/tablero`. Corregido el valor en `roles.ts`
   (`ADMIN_BARBERIA: 'ADMIN'`) + redirección por rol tras login (`rutaInicialPorRol`).
3. ⏳ **Reserva pública falla en silencio** — `.catch(console.error)` sin feedback (`PaginaReservaPublica.tsx`).
4. ⏳ **Badge no-leídos mock** (`usarMensajesNoLeidos.ts` → `total:0`) + `refresh_token` se guarda pero nunca se
   lee ni se valida `expiraEn` → no hay refresh real ni expiración (`usarSesionActiva.ts`).

### 🟡 Importantes (consistencia / robustez)
- ~58 colores hex hardcodeados en login/identidad pese a existir tokens.
- A11y en primitivas (`Campo` sin `aria-invalid`, `Boton` sin `aria-busy`, `MenuAcciones` sin `aria-label`) → afecta a TODO.
- Grids `1fr 1fr` sin media query → desborde a 360px (organización, inventario, periodos).
- Banner de éxito que no se resetea (`PaginaAlcances.tsx`); validación email/teléfono solo HTML5 en reserva pública.
- Enum de dirección de mensaje: backend `ENTRADA/SALIDA` vs front `ENTRANTE/SALIENTE` → alinear.

### 🆕 Faltantes
- 3 capacidades del backend SIN página: **reputación, comisiones, campañas**.
- Página 404 real (hoy catch-all en blanco). Code-splitting (bundle 917 KB).

---

## 3. Hoja de ruta por FASES

> Regla de ejecución: cada pantalla pasa por `disenador-paginas` (plano UX) → `sistema-diseno` (primitivas+tokens)
> → `cablear-api` (datos reales) → `qa-tester` (validación). Nada se da por hecho sin probar contra el backend local.

### FASE 0 — Estabilización (✅ COMPLETA)
Backend completo + tests core + skills/agentes + auditoría QA + críticos #1 y #2 cerrados.

### FASE 1 — Flujo núcleo de referencia: `login → tablero → reservas` ✅ COMPLETA
**Objetivo:** dejar el camino más usado impecable, como vara de calidad para el resto.
- [x] Arreglar bloqueo de rol + redirección por rol (crítico #2).
- [x] Rediseño visual de `PaginaInicioSesion`: 0 hex (CSS dedicado + tokens); responsivo real (panel marca se
      apila ≤860px); a11y (semántica, aria-hidden, role=alert, aria-busy, autoComplete); marca "Aira".
- [x] `PaginaInicioTablero`: ya sólido (cableado, estados, responsivo); tokenizados 4 hardcodes + `--color-whatsapp`.
- [x] Flujo de reservas: ya cableado real (todos los CRUD vía `clienteHttp`, estados, responsivo); cerrados los
      5 hardcodes con tokens de insignia nuevos. Endpoints verificados en vivo (GET /reservas, /clientes → 200).
- **Hecho:** login+tablero+reservas al estándar, sin hardcodes, cableados y verificados.

### FASE 2 — Críticos de frontend restantes + endurecer auth ✅ COMPLETA
- [x] Reserva pública: estado de error + botón Reintentar (crítico #3 cerrado).
- [x] Auth real: `usarSesionActiva` valida `expiraEn`; `refresh_token` ahora se usa (refresh-on-401 en `clienteHttp`,
      reintenta una vez); badge no-leídos contra endpoint real (cuenta conversaciones). Refresh validado en vivo.
- **Hecho:** ningún flujo falla en silencio; sesión vencida cierra; refresh funciona. (Pendiente menor: alinear
  enum ENTRADA/SALIDA vs ENTRANTE/SALIENTE cuando se rediseñe la bandeja WhatsApp.)

### FASE 3 — Consistencia transversal ✅ COMPLETA
- [x] A11y en primitivas: `Campo` (aria-invalid/aria-describedby/role=alert), `Boton` (aria-busy) → toda la app.
- [x] Responsividad: 8 grids `1fr 1fr` → `repeat(auto-fit, minmax(240px,1fr))` (colapsan en móvil).
- [x] Página 404 real (antes pantalla en blanco).
- [x] Code-splitting (`manualChunks`): bundle principal 915 KB → 567 KB + chunks vendor.
- Nota: login/tablero/reservas ya sin hardcodes (Fase 1); barrido total de tokens sigue como mejora continua.

### FASE 4 — Páginas faltantes ✅ COMPLETA (núcleo)
- [x] **Reputación**: `/reputacion` — moderar/publicar reseñas, calificación, filtro por estado. Cableada real.
- [x] **Comisiones**: `/comisiones` — comisiones + liquidaciones (calcular/aprobar/pagar), esquemas, generar. Cableada.
- [x] **Campañas**: `/campanias` — crear, segmentar inactivos (N días), despachar. Cableada.
- Construidas por 3 agentes en paralelo siguiendo `sistema-diseno` + `cablear-api`; 0 hardcodes; rutas + menú
  cableados; build limpio; endpoints verificados en vivo (admin 200, barbero 403).
- [ ] Pendiente menor: UI de cobro de suscripción (botón + historial) en monetización (endpoint `/suscripciones/{id}/cobrar` ya existe).
- **Hecho:** las 16 capacidades del backend tienen UI.

### FASE 5 — Producción (integraciones reales detrás de interfaces ya listas)
- [ ] **Pasarela de pago real** (Culqi para Perú) detrás de `PasarelaPago` + webhook de confirmación de pago.
- [ ] **OAuth2 real de Google Calendar** (reemplaza el sincronizador simulado).
- [ ] **WhatsApp saliente real**: token Meta por empresa (cadena ya lista) + plantillas aprobadas.
- [ ] **SMTP real** (hoy log-only).
- [ ] **Cobertura de tests** ampliada (identidad, agenda, organización) + CI con la BD para tests de integración.
- **Hecho cuando:** una barbería real se onboardea, cobra, agenda por WhatsApp y recibe recordatorios — de punta a punta.

---

## 4. Principios innegociables (todas las fases)
- **Codeplex**: dominio en español; manejador sin lógica de negocio; sin servicios dios; errores de dominio tipados.
- **Frontend no autoriza**: el backend es la verdad; el front solo oculta lo que el rol no puede.
- **Cero datos derivados en BD**; sin `ON DELETE CASCADE`; soft-delete por estado.
- **Una primitiva = un lugar**; **un color = un token**. Si se repite 2+ veces, se extrae.
- **Probar en vivo** contra el backend local (`:9000`) antes de dar algo por hecho.

---

## 5. Contexto operativo (cómo correr/probar)
- BD local CockroachDB `aira` (insecure, `:26257`). Backend en `:9000` con env:
  `DB_SSLMODE=disable DB_NAME=aira DB_USER=root PORT=9000 WA_CIFRADO_CLAVE=<hex 64> WHATSAPP_VERIFY_TOKEN=<x>`.
- Login: `correo_electronico` + `contrasena` (NO "password"). Usuarios de prueba (password `Aira2026!`):
  `super@aira.com` (SUPERADMIN), `admin@aira.com` (ADMIN), `barbero@aira.com` (BARBERO), `dueno@nueva.com` (ADMIN otra empresa).
- Empresa de pruebas A: `b24091f6-de99-452e-8201-24322da78052`. Línea WA seedeada `phone_number_id='1234567890'`.
- Para integraciones reales falta pegar credenciales (Claude, Meta, Google, Culqi, SMTP) — la arquitectura ya las espera.
