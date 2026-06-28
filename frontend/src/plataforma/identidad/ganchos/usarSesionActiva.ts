import { usarAlmacenSesion } from '../almacen-sesion';

// Una sesión vencida NO está activa, aunque el token siga en el almacén.
function expirada(expiraEn: string): boolean {
  if (!expiraEn) return false;
  const t = Date.parse(expiraEn);
  return !Number.isNaN(t) && t <= Date.now();
}

export function usarSesionActiva() {
  const { sesion, cargando } = usarAlmacenSesion();
  return {
    sesion,
    cargando,
    activa: sesion !== null && !expirada(sesion.expiraEn),
  };
}
