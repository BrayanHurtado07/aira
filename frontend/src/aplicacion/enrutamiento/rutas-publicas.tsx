import type { RouteObject } from 'react-router-dom';
import { rutasIdentidad } from '@/capacidades/identidad/rutas';

const RUTAS_PUBLICAS = ['/iniciar-sesion', '/verificar-correo', '/solicitar-reset', '/restablecer-password'];

export const rutasPublicas: RouteObject[] = rutasIdentidad.filter(
  (r) => RUTAS_PUBLICAS.includes(r.path ?? ''),
);
