import type { RouteObject } from 'react-router-dom'
import { PaginaCampanias } from './paginas/PaginaCampanias'

export const rutasCampanias: RouteObject[] = [
  {
    path: '/campanias',
    element: <PaginaCampanias />,
  },
]
