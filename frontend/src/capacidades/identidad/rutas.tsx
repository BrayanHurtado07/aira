import { PaginaInicioSesion } from './paginas/PaginaInicioSesion';
import { PaginaGestionUsuarios } from './paginas/PaginaGestionUsuarios';
import { PaginaVerificarCorreo } from './paginas/PaginaVerificarCorreo';
import { PaginaSolicitarResetPassword } from './paginas/PaginaSolicitarResetPassword';
import { PaginaRestablecerPassword } from './paginas/PaginaRestablecerPassword';

export const rutasIdentidad = [
  {
    path: '/iniciar-sesion',
    element: <PaginaInicioSesion />,
  },
  {
    path: '/usuarios',
    element: <PaginaGestionUsuarios />,
  },
  {
    path: '/verificar-correo',
    element: <PaginaVerificarCorreo />,
  },
  {
    path: '/solicitar-reset',
    element: <PaginaSolicitarResetPassword />,
  },
  {
    path: '/restablecer-password',
    element: <PaginaRestablecerPassword />,
  },
];
