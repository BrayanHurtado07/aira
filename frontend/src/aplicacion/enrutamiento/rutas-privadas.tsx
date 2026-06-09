import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { GuardiaAutenticacion } from '@/plataforma/identidad/guardia-autenticacion';
import { GuardiaRol } from '@/plataforma/activacion/GuardiaRol';
import { DisposicionCaparazon } from '@/plataforma/caparazon/disposicion/DisposicionCaparazon';
import { PaginaInicioTablero } from '@/plataforma/caparazon/tablero/PaginaInicioTablero';
import { ROL } from '@/plataforma/identidad/roles';

import { rutasIdentidad } from '@/capacidades/identidad/rutas';
import { rutasOrganizacion } from '@/capacidades/organizacion/rutas';
import { rutasGobiernoAcceso } from '@/capacidades/gobierno-acceso/rutas';
import { rutasAgenda } from '@/capacidades/agenda/rutas';
import { rutasReservas } from '@/capacidades/reservas/rutas';
import { rutasCanalWhatsApp } from '@/capacidades/canal-whatsapp/rutas';
import { rutasMonetizacion } from '@/capacidades/monetizacion/rutas';
import { rutasLealtad } from '@/capacidades/lealtad/rutas';
import { rutasNotificaciones } from '@/capacidades/notificaciones/rutas';

const PaginaInventario = lazy(() =>
  import('@/capacidades/inventario/paginas/PaginaInventario').then((m) => ({ default: m.PaginaInventario })),
);

const PaginaSuperAdmin = lazy(() =>
  import('@/capacidades/superadmin/paginas/PaginaSuperAdmin').then((m) => ({ default: m.PaginaSuperAdmin })),
);

const rutasAutenticadas = rutasIdentidad.filter((r) => r.path !== '/iniciar-sesion');

export const rutasPrivadas: RouteObject[] = [
  {
    element: (
      <GuardiaAutenticacion>
        <DisposicionCaparazon />
      </GuardiaAutenticacion>
    ),
    children: [
      // Tablero: admin + barbero
      {
        path: '/tablero',
        element: (
          <GuardiaRol roles={[ROL.SUPERADMIN, ROL.ADMIN_BARBERIA, ROL.BARBERO]}>
            <PaginaInicioTablero />
          </GuardiaRol>
        ),
      },

      // Superadmin: solo SUPERADMIN
      {
        path: '/superadmin',
        element: (
          <GuardiaRol roles={[ROL.SUPERADMIN]}>
            <Suspense fallback={null}>
              <PaginaSuperAdmin />
            </Suspense>
          </GuardiaRol>
        ),
      },

      // Identidad
      ...rutasAutenticadas,

      // Organización, accesos: solo admin
      ...rutasOrganizacion,
      ...rutasGobiernoAcceso,

      // Agenda: admin + barbero (la ruta mi-agenda está dentro de rutasAgenda)
      ...rutasAgenda,

      // Reservas: admin + barbero + cliente
      ...rutasReservas,

      // Canal WhatsApp, monetización, notificaciones: solo admin
      ...rutasCanalWhatsApp,
      ...rutasMonetizacion,
      ...rutasNotificaciones,

      // Lealtad: admin + cliente
      ...rutasLealtad,

      // Inventario: solo admin
      {
        path: '/inventario',
        element: (
          <GuardiaRol roles={[ROL.SUPERADMIN, ROL.ADMIN_BARBERIA]}>
            <Suspense fallback={null}>
              <PaginaInventario />
            </Suspense>
          </GuardiaRol>
        ),
      },
    ],
  },
];
