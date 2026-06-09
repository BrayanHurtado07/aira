# Capacidad: Reservas
> Gestión completa del ciclo de vida de reservas, clientes y lista de espera.

## Páginas

| Página | Ruta | Rol |
|--------|------|-----|
| `PaginaReservas` | `/reservas` | Admin + Barbero |
| `PaginaNuevaReserva` | `/reservas/nueva` | Admin + Barbero |
| `PaginaDetalleReserva` | `/reservas/:id` | Admin + Barbero |
| `PaginaGestionClientes` | `/reservas/clientes` | Admin + Barbero |
| `PaginaListaEspera` | `/reservas/lista-espera` | Admin + Barbero |

## Ciclo de vida de una reserva

```
PENDIENTE → CONFIRMADA → COMPLETADA
PENDIENTE → CANCELADA
CONFIRMADA → CANCELADA
CONFIRMADA → NO_ASISTIO
```

## Reglas del dominio

- Una reserva se identifica por: **nombre del cliente + fecha + hora**. Nunca por UUID.
- Un cliente se identifica por: **nombre completo + teléfono**.
- El teléfono del cliente es único por empresa (no puede repetirse).
- Solo se pueden editar reservas en estado PENDIENTE o CONFIRMADA.
- Solo se puede completar una reserva CONFIRMADA.
- No se puede cancelar una reserva COMPLETADA, CANCELADA o NO_ASISTIO.

## Dependencias

- Depende de: `agenda` (barberos, servicios, slots), `organizacion` (sede, período)
- Es consumida por: `lealtad` (acumular sello tras completar), `notificaciones` (recordatorios), `canal_whatsapp` (bot)
