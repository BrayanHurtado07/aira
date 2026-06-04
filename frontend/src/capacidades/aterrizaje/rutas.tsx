import type { RouteObject } from 'react-router-dom';
import { PaginaAterrizaje } from './paginas/PaginaAterrizaje';

export const rutasAterrizaje: RouteObject[] = [
  { path: '/', element: <PaginaAterrizaje /> },
];
