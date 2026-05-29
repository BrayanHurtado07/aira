import { usarAlmacenSesion } from '../almacen-sesion';

export function usarSesionActiva() {
  const { sesion, cargando } = usarAlmacenSesion();
  return {
    sesion,
    cargando,
    activa: sesion !== null,
  };
}
