---
name: sistema-diseno
description: Sistema de diseño canónico de Aira. Úsala SIEMPRE antes de crear o editar cualquier UI (componente, página, pantalla) en frontend/. Garantiza que toda pantalla use las mismas primitivas, los mismos tokens y el mismo lenguaje visual — consistente, profesional, escalable. Prohíbe estilos hardcodeados y componentes duplicados.
---

# sistema-diseno — La única fuente de verdad visual de Aira

> Objetivo: que NINGUNA pantalla se vea distinta de otra usando los mismos elementos.
> Un componente = un solo lugar. Un color/espaciado = un solo token. Cero excepciones.

## Regla de oro (antes de escribir UNA línea de UI)

1. **Busca la primitiva primero.** Mira `frontend/src/compartido/interfaz/primitivas/` y `…/retroalimentacion/`.
   Si existe (`Boton`, `Campo`, `CampoMoneda`, `Selector`, `SelectorFecha`, `SelectorTelefono`, `TablaDatos`,
   `Modal`, `Pestanas`, `SeccionTarjeta`, `EncabezadoPagina`, `DialogoConfirmacion`, `MenuAcciones`,
   `Interruptor`, `BannerAlerta` · feedback: `Cargando`, `Esqueleto`, `Vacio`, `Insignia`, `PantallaCarga`) → **úsala**.
2. **Si no existe pero es reutilizable** (lo usarán 2+ pantallas) → créala como primitiva nueva en
   `compartido/interfaz/` y documenta su uso en `ESTANDARES-PRIMITIVAS.md`. NUNCA inline en la página.
3. **Si es específico de una pantalla** → vive en `capacidades/<x>/componentes/`, pero **compuesto de primitivas**.

Si te descubres copiando JSX de otra pantalla → PARA. Eso es una primitiva que falta extraer.

## Tokens — prohibido hardcodear

- Colores, espaciados, tipografía, radios, sombras → SOLO desde `frontend/src/aplicacion/estilos/tokens.css`
  (variables CSS `var(--…)`). **Prohibido** `#fff`, `color: red`, `padding: 12px`, `margin: 8px` literales.
- Si necesitas un valor que no existe en tokens → agrégalo a `tokens.css` con nombre semántico
  (`--color-peligro`, `--espacio-3`), no un valor suelto.
- Un solo set de tokens gobierna tema claro/oscuro (ver `plataforma/tema/almacen-tema.ts`).

## Responsividad (no es opcional, es parte de cada componente)

- **Mobile-first**: diseña para 360px y escala hacia arriba. El dueño de barbería abre esto en el celular.
- Probar SIEMPRE en 360–430px (iPhone/Pixel), tablet (~820px) y desktop. No dar una pantalla por buena
  sin verla en los tres.
- Breakpoints definidos en tokens (no inventes px sueltos). Layouts fluidos (grid/flex con `gap` por token).
- Nada de scroll horizontal. Áreas táctiles ≥ 44px.

### Catálogo de patrones responsivos OBLIGATORIOS (lecciones ya mapeadas — aplicarlas SIN que las pidan)

1. **Tablas → tarjetas en móvil.** `TablaDatos` NO degrada solo (hace scroll-x). En toda lista densa: ocultar la
   tabla (`display:none`) en `<768px` y renderizar una lista de tarjetas apiladas. Patrón de referencia ya hecho:
   `PaginaReservas` (`.reservas-tabla-wrap` / `.reservas-tarjetas`) y Tablero (equipo).
2. **Formularios pequeños → modal, NO página completa.** Un form de pocos campos va en `Modal` (reusar el form como
   componente para crear+editar). Deep-link con query param (`?nueva=1`) si hay que abrirlo desde otra pantalla.
3. **`Modal` = sheet a pantalla completa en móvil (`<640px`).** Ancho/alto completos (`100dvh`), sin bordes ni
   esquinas. Ya está en la primitiva `Modal` (`.modal-overlay`/`.modal-panel`) — reusarla, no crear modales nuevos.
4. **El modal va por ENCIMA de TODO el chrome.** `z-index` del overlay debe superar navbar (100) y sidebar (200);
   hoy `.modal-overlay` usa `z-index:1000`. Síntoma a evitar: el navbar/sidebar tapa el título o la X del sheet.
5. **Encabezado de página apila en vertical en móvil (`<640px`).** Si no, el `indicador`/badge queda huérfano bajo
   el título y el botón comprime la columna. Ya está en `.encabezado-pagina` (flex-direction:column + acciones full-width).
6. **Acción primaria a ancho completo en móvil** (mejor área táctil). Botones de ícono → ≥44px y con etiqueta de
   texto en la vista de tarjetas.
7. **Acciones que se confunden → color/ícono distinto en reposo** (no solo en hover): un usuario en móvil no tiene hover.

## Accesibilidad (mínimos no negociables)

- Todo input con `label` asociado. Foco visible. Contraste AA. Navegable por teclado.
- Íconos (`lucide-react`) decorativos con `aria-hidden`; los accionables con `aria-label`.
- Modales atrapan foco y cierran con Esc (usa la primitiva `Modal`, no uno nuevo).

## Estados obligatorios en TODA vista de datos

Ninguna pantalla que lista o carga datos se entrega sin los tres:
- **Carga** → `Cargando` / `Esqueleto` (no spinners ad-hoc). Reservá el espacio para evitar saltos de layout.
- **Vacío** → `Vacio` con mensaje útil + acción ("Aún no hay reservas. Crea la primera"). `TablaDatos` acepta `vacioAccion`.
- **Error** → `BannerAlerta` mapeando el error de dominio (ver skill `cablear-api`).

## Datos correctos y honestos (no solo "que cargue")

- **Sin indicadores engañosos sobre cero:** no muestres tendencias/flechas ("+0.0% vs anterior", flecha verde
  hacia arriba) ni comparativas cuando no hay datos. Ocultá el indicador si el valor o el cambio es 0.
- **Coherencia entre filtros/períodos:** los números deben ser consistentes entre sí (ej. "hoy" no puede ser 0 si
  "esta semana" incluye hoy con valor > 0). Cuidado con cálculos de fechas (semanas que empiezan en domingo,
  rangos invertidos). Validar los KPIs cruzando filtros, no solo que el endpoint responda 200.
- **Estado vacío global (onboarding):** una cuenta nueva sin datos NO debe verse como una grilla de ceros (parece
  rota). Plantear un primer-uso con guía/CTA.

## Primitivas compartidas que YA existen (reusar, no reimplementar)

Antes de escribir una celda/badge/avatar inline, usar estas (extraídas justamente porque se duplicaban):
- **`Avatar`** (`primitivas/Avatar.tsx`): monograma 1–2 iniciales, `colorAuto` (color determinístico por nombre).
- **`CeldaCliente`** (`primitivas/CeldaCliente.tsx`): avatar + nombre + teléfono. Toda "celda de cliente" la usa.
- **`Insignia`** (`retroalimentacion/Insignia.tsx`): TODO badge/pill/chip de estado. `EstadoReserva` la envuelve.
- **`TablaDatos`**, **`Modal`**, **`EncabezadoPagina`**, **`Boton`**, **`BannerAlerta`**, **`Vacio`**: ver lista arriba.
- **`Selector`** (envuelve Radix Select): Radix PROHÍBE `Select.Item value=""`. Para una opción "Cualquiera/Todos"
  pasá `valor: ''` SOLO a través de la primitiva `Selector` (mapea a un sentinel interno); nunca a un Radix crudo.
- **Selectores de dominio reutilizables** (encapsulan hook + opciones — NO armar `opciones` inline en cada pantalla):
  `BuscadorCliente` (reservas), `SelectorSede` (organizacion), `SelectorServicio` y `SelectorBarbero`
  (agenda; `SelectorBarbero` acepta `incluirCualquiera`). Reusalos en cualquier form que pida cliente/sede/servicio/barbero.

## z-index — escala fija (respetarla SIEMPRE)

navbar `100` · sidebar `200` · **modal/overlay `1000`** · **dropdowns/popovers/portales `1100`** · toasts `9998+`.
Todo contenido flotante que pueda abrirse DENTRO de un modal (Radix Select `.selector-contenido`, teléfono, calendario,
buscador) debe estar **por encima de 1000**, o se abre detrás del modal y "no se despliega".

## Validar interactuando, no solo cargando

- Las pantallas se prueban **abriendo modales, dropdowns y selects**, no solo con el render inicial: muchos crashes
  (ej. Radix Select con value vacío) solo saltan al interactuar.
- Auditar la forma de los endpoints **con datos sembrados** (una lista vacía esconde el bug de json-tags/PascalCase).

## Lenguaje (Codeplex)

- Nombres de componentes y dominio en **español** (`SelectorBarbero`, no `BarberPicker`).
- Stack permitido en inglés: React, hooks, props, Vite, Radix, lucide.

## Checklist de salida (responde SÍ a todo antes de dar UI por hecha)

- [ ] No dupliqué JSX de otra pantalla (reusé o extraje primitiva)
- [ ] Cero colores/espaciados hardcodeados (todo `var(--…)`)
- [ ] Funciona y se ve bien en 360px y en desktop
- [ ] Tiene estados carga/vacío/error
- [ ] Labels + foco + contraste OK
- [ ] Nombres de dominio en español

> Para diseñar la composición de una página completa → usa el agente `disenador-paginas`.
> Para conectar la página a datos reales → usa la skill `cablear-api`.
> Para validar que todo quedó bien → usa el agente `qa-tester`.
