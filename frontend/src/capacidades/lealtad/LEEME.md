# Capacidad: Lealtad
> Sistema de sellos para premiar la fidelidad de clientes.

## Página

| Página | Ruta | Rol |
|--------|------|-----|
| `PaginaLealtad` | `/lealtad` | Admin |

## Reglas del dominio

- Solo puede existir un programa de lealtad activo por empresa.
- Una tarjeta de lealtad se crea automáticamente al acumular el primer sello.
- Solo se pueden acumular sellos sobre reservas COMPLETADAS.
- Para aplicar un canje, el cliente debe tener al menos tantos sellos como indica el programa.
- **Nunca mostrar** `id_programa`, `id_tarjeta`, `id_sello`, `id_canje`.
- El cliente se identifica por nombre + teléfono.

## Dependencias

- Depende de: `reservas` (reservas completadas para acumular sello)
