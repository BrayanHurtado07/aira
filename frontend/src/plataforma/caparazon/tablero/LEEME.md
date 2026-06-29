# Tablero — Especificación UI/UX
> Ruta: `/tablero` · Rol: Admin + Barbero (vistas diferenciadas)

---

## Propósito

Pantalla de bienvenida y métricas de negocio en tiempo real. La primera pantalla que ve el usuario al iniciar sesión.

---

## Vista Admin

### Métricas principales (tarjetas grandes)
| Métrica | Dato | Formato |
|---------|------|---------|
| Reservas hoy | Conteo | Número grande con ícono `Calendar` |
| Reservas pendientes | Conteo | Con ícono `Clock`, color advertencia si > 0 |
| Clientes activos | Conteo | Con ícono `Users` |
| Ingresos del período | Suma | `"S/ 1,234.50"` con ícono `TrendingUp` |

### Acciones rápidas
- "Nueva reserva" → `/reservas?nueva=1` (abre el modal de nueva reserva)
- "Registrar cliente" → `/reservas/clientes`
- "Ver agenda" → `/agenda/disponibilidad`
- "Conversaciones" → `/canal-whatsapp`

### Gráfica (si aplica)
- Reservas por día de la semana o por estado.
- Sin datos de usuario individual — solo agregados.

---

## Vista Barbero (diferenciada)

### Métricas
- Mis reservas hoy (solo las del barbero autenticado).
- Mis reservas pendientes.

### Acciones rápidas
- "Mis reservas" → `/reservas`
- "Mis clientes" → `/reservas/clientes`

### Chip de rol
- Visible en la cabecera: `"Barbero"` en chip ámbar.

---

## Reglas UX

- Los datos de métricas vienen de `GET /api/tablero/metricas` con el contexto del período activo.
- Nunca mostrar UUIDs en ningún card ni estadística.
- Si no hay período activo: mostrar banner advertencia "No hay período activo. Las métricas pueden estar incompletas."
- El gancho `usarMetricasTablero` del directorio `ganchos/` gestiona la carga y refresco.
- En carga inicial: `Esqueleto` en las tarjetas de métricas.
- El período de las métricas se muestra como: `"Período: [nombre] · [fecha inicio] – [fecha fin]"`.
