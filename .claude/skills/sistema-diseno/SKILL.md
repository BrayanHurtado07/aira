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
- Breakpoints definidos en tokens (no inventes px sueltos). Layouts fluidos (grid/flex con `gap` por token).
- Toda tabla densa (`TablaDatos`) debe degradar a tarjetas apiladas en móvil.
- Nada de scroll horizontal. Áreas táctiles ≥ 44px.

## Accesibilidad (mínimos no negociables)

- Todo input con `label` asociado. Foco visible. Contraste AA. Navegable por teclado.
- Íconos (`lucide-react`) decorativos con `aria-hidden`; los accionables con `aria-label`.
- Modales atrapan foco y cierran con Esc (usa la primitiva `Modal`, no uno nuevo).

## Estados obligatorios en TODA vista de datos

Ninguna pantalla que lista o carga datos se entrega sin los tres:
- **Carga** → `Cargando` / `Esqueleto` (no spinners ad-hoc).
- **Vacío** → `Vacio` con mensaje útil + acción ("Aún no hay reservas. Crea la primera").
- **Error** → `BannerAlerta` mapeando el error de dominio (ver skill `cablear-api`).

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
