import type { RouteObject } from 'react-router-dom'
import { PaginaRecordatorios } from './paginas/PaginaRecordatorios'
import { PaginaPlantillas } from './paginas/PaginaPlantillas'

export const rutasNotificaciones: RouteObject[] = [
  { path: '/notificaciones', element: <PaginaRecordatorios /> },
  { path: '/plantillas', element: <PaginaPlantillas /> },
]
