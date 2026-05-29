import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { PaginaGestionBarberos } from './paginas/PaginaGestionBarberos'
import { PaginaGestionServicios } from './paginas/PaginaGestionServicios'
import { PaginaTarifasEspeciales } from './paginas/PaginaTarifasEspeciales'

export const rutasAgenda: RouteObject[] = [
  { path: '/agenda', element: <Navigate to="/agenda/barberos" replace /> },
  { path: '/agenda/barberos', element: <PaginaGestionBarberos /> },
  { path: '/agenda/servicios', element: <PaginaGestionServicios /> },
  { path: '/agenda/tarifas', element: <PaginaTarifasEspeciales /> },
]
