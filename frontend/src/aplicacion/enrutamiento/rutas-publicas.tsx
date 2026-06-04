import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { rutasIdentidad } from '@/capacidades/identidad/rutas';
import { rutasReservaPublica } from '@/capacidades/reserva-publica/rutas';

const PaginaAterrizaje = lazy(() =>
  import('@/capacidades/aterrizaje/paginas/PaginaAterrizaje').then((m) => ({
    default: m.PaginaAterrizaje,
  })),
);

const RUTAS_PUBLICAS = ['/iniciar-sesion', '/verificar-correo', '/solicitar-reset', '/restablecer-password'];

export const rutasPublicas: RouteObject[] = [
  {
    path: '/',
    element: (
      <Suspense fallback={null}>
        <PaginaAterrizaje />
      </Suspense>
    ),
  },
  ...rutasIdentidad.filter((r) => RUTAS_PUBLICAS.includes(r.path ?? '')),
  ...rutasReservaPublica,
];
