import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { rutasPublicas } from './rutas-publicas';
import { rutasPrivadas } from './rutas-privadas';

const enrutador = createBrowserRouter([
  ...rutasPublicas,
  ...rutasPrivadas,
  { path: '*', element: null },
]);

export function Enrutamiento() {
  return <RouterProvider router={enrutador} />;
}
