import type { RouteObject } from 'react-router-dom';
import { PaginaReservas } from './paginas/PaginaReservas';
import { PaginaDetalleReserva } from './paginas/PaginaDetalleReserva';
import { PaginaGestionClientes } from './paginas/PaginaGestionClientes';
import { PaginaListaEspera } from './paginas/PaginaListaEspera';

export const rutasReservas: RouteObject[] = [
  { path: '/reservas', element: <PaginaReservas /> },
  { path: '/reservas/clientes', element: <PaginaGestionClientes /> },
  { path: '/reservas/lista-espera', element: <PaginaListaEspera /> },
  { path: '/reservas/:reservaId', element: <PaginaDetalleReserva /> },
];
