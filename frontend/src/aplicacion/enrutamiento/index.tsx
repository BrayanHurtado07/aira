import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { rutasPublicas } from './rutas-publicas';
import { rutasPrivadas } from './rutas-privadas';
import { Pagina404 } from './Pagina404';

const enrutador = createBrowserRouter([
  ...rutasPublicas,
  ...rutasPrivadas,
  { path: '*', element: <Pagina404 /> },
]);

export function Enrutamiento() {
  return <RouterProvider router={enrutador} />;
}
