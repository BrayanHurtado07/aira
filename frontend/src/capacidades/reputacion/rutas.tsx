import type { RouteObject } from 'react-router-dom'
import { PaginaReputacion } from './paginas/PaginaReputacion'

export const rutasReputacion: RouteObject[] = [
  {
    path: '/reputacion',
    element: <PaginaReputacion />,
  },
]
