import type { RouteObject } from 'react-router-dom'
import { PaginaLealtad } from './paginas/PaginaLealtad'

export const rutasLealtad: RouteObject[] = [
  {
    path: '/lealtad',
    element: <PaginaLealtad />,
  },
]
