# Bandeja de WhatsApp — Especificación UI/UX
> Rutas: `/canal-whatsapp` y `/canal-whatsapp/:conversacionId` · Rol: Admin
> Una sola página (`PaginaConversaciones`) renderiza la **bandeja unificada master-detail**
> (`BandejaWhatsApp`). El detalle es la misma pantalla con una conversación seleccionada.

---

## Diseño: bandeja master-detail (estilo WhatsApp Web)

- **Desktop (≥769px):** lista a la izquierda (`.wa-panel-lista`, 22rem) + conversación a la derecha.
  Sin selección → panel intro explicativo (`PanelIntroConversacion`).
- **Móvil (≤768px):** se ve un panel a la vez. La clase `.wa-bandeja--con-seleccion` (presente cuando
  hay `:conversacionId` en la URL) oculta la lista y muestra el chat con botón "volver".
- El deep-link `/canal-whatsapp/:id` sigue funcionando: la bandeja lee el id de la URL.

---

## ⚠️ Datos REALES del backend (no inventar lo que no existe)

| Endpoint | Devuelve | NO devuelve |
|----------|----------|-------------|
| `GET /conversaciones` | `id, empresa_id, numero_cliente, estado (ACTIVA\|CERRADA), creado_en` | último mensaje, conteo sin-leer, nombre del cliente, estado EXPIRADA |
| `GET /mensajes?conversacion_id=` | `id, conversacion_id, contenido, tipo, direccion (ENTRANTE\|SALIENTE), creado_en` | autor (bot vs humano), URL de media |

**Reglas de honestidad (no romper):**
- **NO** mostrar "X sin leer": el backend no rastrea leído/no-leído. (Antes había un badge que mentía
  mostrando el total de conversaciones — eliminado junto con `usarMensajesNoLeidos`.)
- **NO** mostrar "último mensaje" en la lista: no viene en `/conversaciones`.
- Los mensajes `SALIDA` no distinguen bot vs humano → se rotulan como del negocio, no como "Aira IA" por mensaje.
  El contexto de que **Aira IA responde sola** se comunica en el intro y en la cabecera del chat ("Atendido por Aira IA").
- `tipo` ≠ TEXTO (IMAGEN/AUDIO/DOCUMENTO) se muestra como marcador con ícono, no como media falsa
  (no hay URL del archivo todavía).

Cuando el backend exponga estos datos (último mensaje, no-leídos, nombre de cliente, autor, media),
ampliar aquí — la fuente de datos vive en `ganchos/` y `servicios/`, no en los componentes.

---

## Lista (master) — `PanelListaConversaciones`
- Identidad por **número** (`Avatar colorAuto` + número formateado `+51 999 888 777`).
- `Insignia`: Activa (éxito) / Cerrada (neutral).
- Hora relativa de `creado_en` (hoy → "14:30", ayer → "Ayer", resto → "23 ene").
- Buscador por número + filtro Todas/Activas/Cerradas.
- Estados: carga (`Cargando`), error (`BannerAlerta`), vacío (`Vacio` con mensaje de onboarding).

## Detalle — `PanelConversacion`
- Cabecera: botón volver (solo móvil), avatar + número, "Atendido por Aira IA", `Insignia` de estado.
- Hilo: burbujas ENTRANTE (izq.) / SALIENTE (der., verde WhatsApp), hora 24h, separadores de día
  ("Hoy"/"Ayer"/fecha), auto-scroll al final.
- `CajaRespuesta`: textarea que crece, Enter envía / Shift+Enter salto. Si la conversación está **CERRADA**,
  la caja se **bloquea** con aviso (enviar fallaría con `ErrConversacionNoActiva` en el backend).

## Reglas UX
- El id de la conversación en la URL es opaco — el usuario nunca lo ve ni lo copia.
- El número de teléfono es la identidad primaria en WhatsApp.
- Todo con tokens (`var(--…)`); nada hardcodeado. Estilos en `index.css` bajo `/* Canal WhatsApp — Bandeja */`.
