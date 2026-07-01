import type { RouteObject } from 'react-router-dom'
import { PaginaConversaciones } from './paginas/PaginaConversaciones'

// Ambas rutas renderizan la misma bandeja unificada; el detalle es la misma
// pantalla con una conversación seleccionada (master-detail).
export const rutasCanalWhatsApp: RouteObject[] = [
  {
    path: '/canal-whatsapp',
    element: <PaginaConversaciones />,
  },
  {
    path: '/canal-whatsapp/:conversacionId',
    element: <PaginaConversaciones />,
  },
]
