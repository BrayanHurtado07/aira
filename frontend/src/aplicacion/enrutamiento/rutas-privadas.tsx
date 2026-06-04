import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { GuardiaAutenticacion } from '@/plataforma/identidad/guardia-autenticacion';
import { DisposicionCaparazon } from '@/plataforma/caparazon/disposicion/DisposicionCaparazon';
import { PaginaInicioTablero } from '@/plataforma/caparazon/tablero/PaginaInicioTablero';

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

const rutasAutenticadas = rutasIdentidad.filter((r) => r.path !== '/iniciar-sesion');

export const rutasPrivadas: RouteObject[] = [
  {
    element: (
      <GuardiaAutenticacion>
        <DisposicionCaparazon />
      </GuardiaAutenticacion>
    ),
    children: [
      { path: '/tablero', element: <PaginaInicioTablero /> },
      ...rutasAutenticadas,
      ...rutasOrganizacion,
      ...rutasGobiernoAcceso,
      ...rutasAgenda,
      ...rutasReservas,
      ...rutasCanalWhatsApp,
      ...rutasMonetizacion,
      ...rutasLealtad,
      ...rutasNotificaciones,
      {
        path: '/inventario',
        element: (
          <Suspense fallback={null}>
            <PaginaInventario />
          </Suspense>
        ),
      },
    ],
  },
];
