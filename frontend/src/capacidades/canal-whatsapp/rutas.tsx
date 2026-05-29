import type { RouteObject } from 'react-router-dom'
import { PaginaConversaciones } from './paginas/PaginaConversaciones'
import { PaginaDetalleConversacion } from './paginas/PaginaDetalleConversacion'

export const rutasCanalWhatsApp: RouteObject[] = [
  {
    path: '/canal-whatsapp',
    element: <PaginaConversaciones />,
  },
  {
    path: '/canal-whatsapp/:conversacionId',
    element: <PaginaDetalleConversacion />,
  },
]
