import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'

const PaginaReservaPublica = lazy(() =>
  import('./paginas/PaginaReservaPublica').then((m) => ({ default: m.PaginaReservaPublica })),
)

export const rutasReservaPublica: RouteObject[] = [
  {
    path: '/reservar/:empresaID',
    element: (
      <Suspense fallback={null}>
        <PaginaReservaPublica />
      </Suspense>
    ),
  },
]
