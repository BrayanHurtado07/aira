# Capacidad: Agenda
> Gestión del equipo de barberos, servicios ofrecidos, disponibilidad semanal, excepciones y tarifas especiales.

## Páginas

| Página | Ruta | Rol |
|--------|------|-----|
| `PaginaGestionBarberos` | `/agenda/barberos` | Admin |
| `PaginaGestionServicios` | `/agenda/servicios` | Admin |
| `PaginaAgendaBarbero` | `/agenda/disponibilidad` | Admin |
| `PaginaTarifasEspeciales` | `/agenda/tarifas` | Admin |

## Reglas del dominio

- Un barbero puede tener múltiples disponibilidades (una por día-sede).
- Un barbero puede tener múltiples servicios asignados.
- Las excepciones bloquean días específicos para un barbero (feriados, vacaciones).
- Las tarifas especiales sobreescriben el precio base de un servicio en una fecha puntual.
- **Nunca mostrar** `id_barbero`, `id_servicio` ni `id_disponibilidad` al usuario.
- El barbero se identifica por su **nombre completo**.
- El servicio se identifica por su **nombre**.

## Dependencias

- Depende de: `organizacion` (sedes para disponibilidad)
- Es consumida por: `reservas` (para crear reservas), `canal_whatsapp` (para atender chat)

## Estandares UI aplicables

Ver `/ESTANDARES-UI.md` para reglas completas de colores, tipografía, validaciones y avatares.
