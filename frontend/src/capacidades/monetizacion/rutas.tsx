import type { RouteObject } from 'react-router-dom'
import { PaginaSuscripcion } from './paginas/PaginaSuscripcion'

export const rutasMonetizacion: RouteObject[] = [
  {
    path: '/monetizacion',
    element: <PaginaSuscripcion />,
  },
]
