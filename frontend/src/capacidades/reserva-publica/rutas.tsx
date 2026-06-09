import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'

const PaginaReservaPublica = lazy(() =>
  import('./paginas/PaginaReservaPublica').then((m) => ({ default: m.PaginaReservaPublica })),
)

export const rutasReservaPublica: RouteObject[] = [
  {
    path: '/reservar/:slug',
    element: (
      <Suspense fallback={null}>
        <PaginaReservaPublica />
      </Suspense>
    ),
  },
]
