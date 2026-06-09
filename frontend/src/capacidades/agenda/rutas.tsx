import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { GuardiaRol } from '@/plataforma/activacion/GuardiaRol'
import { ROL } from '@/plataforma/identidad/roles'
import { PaginaGestionBarberos } from './paginas/PaginaGestionBarberos'
import { PaginaGestionServicios } from './paginas/PaginaGestionServicios'
import { PaginaTarifasEspeciales } from './paginas/PaginaTarifasEspeciales'
import { PaginaAgendaBarbero } from './paginas/PaginaAgendaBarbero'

export const rutasAgenda: RouteObject[] = [
  // /agenda → ADMIN ve gestión, BARBERO ve su propia agenda
  {
    path: '/agenda',
    element: (
      <GuardiaRol roles={[ROL.SUPERADMIN, ROL.ADMIN_BARBERIA, ROL.BARBERO]} redirigirA="/tablero">
        <Navigate to="/agenda/barberos" replace />
      </GuardiaRol>
    ),
  },

  // Mi agenda: exclusivo para BARBERO
  {
    path: '/agenda/mi-agenda',
    element: (
      <GuardiaRol roles={[ROL.BARBERO]} redirigirA="/agenda/barberos">
        <PaginaAgendaBarbero />
      </GuardiaRol>
    ),
  },

  // Gestión de barberos: solo admin
  {
    path: '/agenda/barberos',
    element: (
      <GuardiaRol roles={[ROL.SUPERADMIN, ROL.ADMIN_BARBERIA]} redirigirA="/agenda/mi-agenda">
        <PaginaGestionBarberos />
      </GuardiaRol>
    ),
  },

  // Servicios: solo admin
  {
    path: '/agenda/servicios',
    element: (
      <GuardiaRol roles={[ROL.SUPERADMIN, ROL.ADMIN_BARBERIA]} redirigirA="/tablero">
        <PaginaGestionServicios />
      </GuardiaRol>
    ),
  },

  // Tarifas: solo admin
  {
    path: '/agenda/tarifas',
    element: (
      <GuardiaRol roles={[ROL.SUPERADMIN, ROL.ADMIN_BARBERIA]} redirigirA="/tablero">
        <PaginaTarifasEspeciales />
      </GuardiaRol>
    ),
  },
]
