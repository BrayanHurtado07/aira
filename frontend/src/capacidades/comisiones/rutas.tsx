import type { RouteObject } from 'react-router-dom'
import { PaginaComisiones } from './paginas/PaginaComisiones'

export const rutasComisiones: RouteObject[] = [
  {
    path: '/comisiones',
    element: <PaginaComisiones />,
  },
]
