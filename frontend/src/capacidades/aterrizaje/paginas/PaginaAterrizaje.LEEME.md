# PaginaAterrizaje — Especificación UI/UX
> Ruta: `/` · Rol: Público (sin auth)

---

## Propósito

Landing page de marketing de AIRA. Primera impresión para barberías potenciales clientes.

---

## Secciones (en orden)

### 1. Navegación (`NavegacionAterrizaje`)
- Logo de AIRA a la izquierda.
- Botón "Iniciar sesión" a la derecha → `/iniciar-sesion`.
- Sin elementos que expongan datos internos.
- Sticky en el top al hacer scroll.

### 2. Hero (`HeroAterrizaje`)
- Headline principal: propuesta de valor en 1-2 líneas.
- Subheadline: descripción breve.
- CTA principal: "Empieza hoy, gratis" → `/iniciar-sesion` o formulario de registro.
- CTA secundario: "Ver cómo funciona" → scroll a sección "Cómo funciona".
- Elemento visual decorativo (imagen, ilustración o animación).

### 3. Marquee de características
- Carrusel horizontal continuo con features clave: "Reservas", "Barberos", "Clientes", "WhatsApp", "Lealtad", "Reportes".
- Solo texto + ícono. Sin datos de usuario.

### 4. Características (`SeccionCaracteristicas`)
- Grid de 3-4 tarjetas con ícono, título y descripción breve.
- Cada tarjeta describe una capacidad del producto.
- Sin capturas de pantalla con datos reales — usar mockups neutros.

### 5. Cómo funciona (`SeccionComoFunciona`)
- Pasos numerados (1, 2, 3) explicando el flujo principal.
- Simple, sin jerga técnica.

### 6. Planes (`SeccionPlanes`)
- Cards de planes: Básico, Pro, Enterprise.
- Precio, features principales, CTA.
- Sin exponer IDs de plan.

### 7. CTA final
- Repetición del CTA principal.

### 8. Pie (`PieAterrizaje`)
- Logo + links de navegación secundarios.
- Sin datos de usuario.

---

## Reglas UX
- Esta página no tiene acceso a sesión — no mostrar datos de usuario en ninguna parte.
- Si hay sesión activa, el botón "Iniciar sesión" cambia a "Ir al tablero" → `/tablero`.
- Optimizada para SEO: cada sección tiene un `id` para anclas (ej: `#planes`, `#como-funciona`).
- Animaciones de entrada con `springSuave` y `delayItem` de `motion.ts`.
- Totalmente responsiva — la sección Hero en móvil es una sola columna.
